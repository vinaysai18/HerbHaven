const mongoose = require("mongoose");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const Order = require("../models/Order");

const isNonNegativeInteger = (value) =>
  Number.isSafeInteger(value) && value >= 0;
const paymentReservationExpiry = () =>
  new Date(Date.now() + 15 * 60 * 1000);

const aggregateItems = (items) => {
  const quantities = new Map();
  for (const item of items) {
    const id = String(item.product);
    const quantity = (quantities.get(id) || 0) + item.quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Aggregated order quantity is invalid.");
    }
    quantities.set(id, quantity);
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

async function changeStock({
  productId,
  delta,
  reason,
  userId = null,
  orderId = null,
}) {
  if (!Number.isSafeInteger(delta) || delta === 0) {
    throw new Error("Stock change must be a non-zero integer.");
  }

  const condition = { _id: productId };
  if (delta < 0) condition.stockQuantity = { $gte: Math.abs(delta) };
  if (delta > 0) {
    condition.$or = [
      { stockQuantity: { $lte: Number.MAX_SAFE_INTEGER - delta } },
      { stockQuantity: { $exists: false } },
    ];
  }

  const product = await Product.findOneAndUpdate(
    condition,
    { $inc: { stockQuantity: delta } },
    { new: false, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new Error("Product not found.");
    throw new Error("Insufficient stock for this operation.");
  }

  const previousQuantity = product.stockQuantity || 0;
  const resultingQuantity = previousQuantity + delta;

  try {
    await InventoryMovement.create({
      product: product._id,
      quantityChange: delta,
      previousQuantity,
      resultingQuantity,
      reason,
      order: orderId,
      performedBy: userId,
    });
  } catch (error) {
    try {
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stockQuantity: -delta } }
      );
    } catch (rollbackError) {
      console.error("Inventory movement rollback failed:", rollbackError);
    }
    throw error;
  }

  return { previousQuantity, resultingQuantity };
}

async function reserveOrderItems(items, userId, orderId) {
  const changed = [];
  try {
    for (const item of aggregateItems(items)) {
      await changeStock({
        productId: item.productId,
        delta: -item.quantity,
        reason: "Order reservation",
        userId,
        orderId,
      });
      changed.push(item);
    }
  } catch (error) {
    for (const item of changed.reverse()) {
      try {
        await changeStock({
          productId: item.productId,
          delta: item.quantity,
          reason: "Order reservation rollback",
          userId,
          orderId,
        });
      } catch (rollbackError) {
        console.error("Order stock reservation rollback failed:", rollbackError);
      }
    }
    throw error;
  }
}

async function restoreOrderItems(order, reason, userId = null) {
  for (const item of aggregateItems(order.items)) {
    if (!mongoose.isValidObjectId(item.productId)) continue;
    await changeStock({
      productId: item.productId,
      delta: item.quantity,
      reason,
      userId,
      orderId: order._id,
    });
  }
}

async function releaseOrderReservation(orderId, reason, userId = null, fields = {}) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, inventoryStatus: "Reserved" },
    {
      $set: {
        ...fields,
        inventoryStatus: "Released",
        reservationExpiresAt: null,
      },
    },
    { new: true }
  );
  if (!order) return null;
  await restoreOrderItems(order, reason, userId);
  return order;
}

async function ensureOrderReservation(order, userId = null) {
  const currentOrder = await Order.findById(order._id).select(
    "inventoryStatus status paymentStatus"
  );
  if (!currentOrder) return false;
  if (
    currentOrder.inventoryStatus === "Reserved" ||
    (currentOrder.inventoryStatus === "Committed" &&
      currentOrder.paymentStatus === "Paid")
  ) return true;
  if (["Cancelled", "Returned"].includes(currentOrder.status)) return false;
  if (!["Released", "Not Reserved"].includes(currentOrder.inventoryStatus)) {
    return false;
  }

  const previousInventoryStatus = currentOrder.inventoryStatus;
  const claim = await Order.findOneAndUpdate(
    {
      _id: order._id,
      inventoryStatus: previousInventoryStatus,
      paymentStatus: { $in: ["Pending", "Failed"] },
      status: { $nin: ["Cancelled", "Returned"] },
    },
    { $set: { inventoryStatus: "Reserving" } },
    { new: true }
  );
  if (!claim) return false;

  try {
    await reserveOrderItems(order.items, userId, order._id);
    const reserved = await Order.findOneAndUpdate(
      {
        _id: order._id,
        inventoryStatus: "Reserving",
        status: { $nin: ["Cancelled", "Returned"] },
      },
      {
        $set: {
          inventoryStatus: "Reserved",
          paymentStatus: "Pending",
          reservationExpiresAt: paymentReservationExpiry(),
        },
      },
      { new: true }
    );
    if (!reserved) {
      await restoreOrderItems(order, "Payment reservation rollback", userId);
      await Order.updateOne(
        { _id: order._id, inventoryStatus: "Reserving" },
        { $set: { inventoryStatus: previousInventoryStatus } }
      );
      return false;
    }
  } catch (error) {
    await Order.updateOne(
      { _id: order._id, inventoryStatus: "Reserving" },
      { $set: { inventoryStatus: previousInventoryStatus } }
    );
    throw error;
  }
  return true;
}

let expirySweepRunning = false;
let lastExpirySweepErrorAt = 0;
async function expirePaymentReservations() {
  if (expirySweepRunning) return 0;
  if (mongoose.connection.readyState !== 1) return 0;
  expirySweepRunning = true;
  let releasedCount = 0;
  try {
    let expiredOrders;
    try {
      expiredOrders = await Order.find({
        paymentMethod: "Razorpay",
        paymentStatus: "Pending",
        inventoryStatus: "Reserved",
        reservationExpiresAt: { $lte: new Date() },
      })
        .select("_id")
        .limit(50);
      lastExpirySweepErrorAt = 0;
    } catch (error) {
      const now = Date.now();
      if (now - lastExpirySweepErrorAt >= 5 * 60 * 1000) {
        console.error(
          "Inventory reservation expiry sweep could not reach MongoDB:",
          error.message
        );
        lastExpirySweepErrorAt = now;
      }
      return 0;
    }

    for (const order of expiredOrders) {
      try {
        const released = await releaseOrderReservation(
          order._id,
          "Unpaid payment reservation expired",
          null,
          { paymentStatus: "Failed", reservationExpiresAt: null }
        );
        if (released) releasedCount += 1;
      } catch (error) {
        console.error("Failed to expire payment reservation:", order._id, error);
      }
    }
    return releasedCount;
  } finally {
    expirySweepRunning = false;
  }
}

module.exports = {
  aggregateItems,
  changeStock,
  isNonNegativeInteger,
  ensureOrderReservation,
  expirePaymentReservations,
  paymentReservationExpiry,
  reserveOrderItems,
  releaseOrderReservation,
  restoreOrderItems,
};
