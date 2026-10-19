
const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Product = require("../models/Product");
const {
  ensureOrderReservation,
  paymentReservationExpiry,
  releaseOrderReservation,
  reserveOrderItems,
  restoreOrderItems,
} = require("../services/inventoryService");

// Support common authentication middleware user ID formats.
const getAuthenticatedUserId = (req) =>
  req.user?._id || req.userId || req.user?.id;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order and save the corresponding MongoDB order.
const createPaymentOrder = async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    const userId = getAuthenticatedUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "User authentication failed. Please log in again.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        message: "Delivery address is required.",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        message: "Razorpay configuration is missing.",
      });
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = item.productId || item.product || item._id;

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          message: `Invalid product ID: ${productId || "missing"}`,
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${productId}`,
        });
      }

      const quantity =
        typeof item.quantity === "string" && /^\d+$/.test(item.quantity)
          ? Number(item.quantity)
          : item.quantity;

      if (
        typeof quantity !== "number" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Each item must have a valid quantity.",
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: `Invalid price for product: ${product.name}`,
        });
      }

      totalAmount += price * quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        image: product.image || "",
      });
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order amount.",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${new mongoose.Types.ObjectId()}`,
    });

    const order = await Order.create({
      user: userId,
      items: validatedItems,
      deliveryAddress,
      totalAmount,
      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
      status: "Pending",
      razorpayOrderId: razorpayOrder.id,
      refundStatus: "Not Applicable",
      inventoryStatus: "Not Reserved",
      reservationExpiresAt: paymentReservationExpiry(),
    });

    let stockReserved = false;
    try {
      await reserveOrderItems(order.items, userId, order._id);
      stockReserved = true;
      order.inventoryStatus = "Reserved";
      await order.save();
    } catch (error) {
      if (stockReserved) {
        await restoreOrderItems(order, "Payment order creation failed", userId);
      }
      await Order.findByIdAndDelete(order._id);
      if (error.message === "Insufficient stock for this operation.") {
        return res.status(409).json({
          message: "One or more items no longer have enough stock. Please update your cart.",
        });
      }
      throw error;
    }

    return res.status(201).json({
      message: "Payment order created successfully.",
      order,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      message: "Unable to create payment order.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// Verify Razorpay payment.
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = getAuthenticatedUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "User authentication failed. Please log in again.",
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification details are missing.",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay configuration is missing.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature.",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "Paid") {
      if (order.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({
          message: "Payment was already verified.",
          success: true,
          order,
        });
      }

      return res.status(409).json({
        message: "This order has already been paid with another payment.",
      });
    }

    // Verify the payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.currency !== "INR" ||
      payment.amount !== Math.round(order.totalAmount * 100) ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        message: "Payment is not captured or its details do not match.",
      });
    }

    try {
      if (!(await ensureOrderReservation(order, userId))) {
        return res.status(409).json({
          message: "Payment was captured, but the order can no longer be reserved. Contact support immediately.",
        });
      }
    } catch (error) {
      if (error.message === "Insufficient stock for this operation.") {
        return res.status(409).json({
          message: "Payment was captured, but stock is no longer available. Contact support immediately.",
        });
      }
      throw error;
    }

    const paidOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: "Pending",
        inventoryStatus: "Reserved",
        status: { $nin: ["Cancelled", "Returned"] },
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          paymentStatus: "Paid",
          status: "Confirmed",
          inventoryStatus: "Committed",
          reservationExpiresAt: null,
        },
      },
      { new: true }
    );
    if (!paidOrder) {
      const currentOrder = await Order.findById(order._id);
      if (
        currentOrder?.paymentStatus === "Paid" &&
        currentOrder.razorpayPaymentId === razorpay_payment_id
      ) {
        return res.status(200).json({
          message: "Payment was already verified.",
          success: true,
          order: currentOrder,
        });
      }
      return res.status(409).json({
        message: "Order inventory is no longer reserved. Contact support if payment was captured.",
      });
    }

    return res.status(200).json({
      message: "Payment verified successfully.",
      success: true,
      order: paidOrder,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      message: "Payment verification failed.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// Create a new Razorpay payment order for an unpaid existing order.
const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = getAuthenticatedUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "User authentication failed. Please log in again.",
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (
      order.paymentStatus === "Paid" ||
      order.paymentStatus === "Refunded"
    ) {
      return res.status(400).json({
        message: "This order cannot be paid for again.",
      });
    }

    if (order.paymentMethod !== "Razorpay") {
      return res.status(400).json({
        message: "Retry payment is available only for Razorpay orders.",
      });
    }

    if (
      order.status === "Cancelled" ||
      order.status === "Returned"
    ) {
      return res.status(400).json({
        message: "Cancelled or returned orders cannot be paid for.",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: `retry_${order._id}_${Date.now()}`,
    });

    const retriedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: userId,
        paymentStatus: { $in: ["Pending", "Failed"] },
        inventoryStatus: { $in: ["Reserved", "Released", "Not Reserved"] },
        status: { $nin: ["Cancelled", "Returned"] },
      },
      {
        $set: {
          razorpayOrderId: razorpayOrder.id,
          paymentStatus: "Pending",
          reservationExpiresAt: paymentReservationExpiry(),
        },
      },
      { new: true }
    );
    if (!retriedOrder) {
      return res.status(409).json({
        message: "Order status changed. Refresh before retrying payment.",
      });
    }

    if (retriedOrder.inventoryStatus !== "Reserved") {
      let reserved = false;
      try {
        reserved = await ensureOrderReservation(retriedOrder, userId);
      } catch (error) {
        if (error.message !== "Insufficient stock for this operation.") throw error;
      }
      if (!reserved) {
        await Order.updateOne(
          {
            _id: retriedOrder._id,
            razorpayOrderId: razorpayOrder.id,
            inventoryStatus: { $in: ["Released", "Not Reserved"] },
            paymentStatus: "Pending",
          },
          { $set: { paymentStatus: "Failed" } }
        );
        return res.status(409).json({
          message: "There is no longer enough stock to retry this order.",
        });
      }
    }

    const currentOrder = await Order.findById(retriedOrder._id);

    return res.status(200).json({
      message: "Retry payment order created.",
      order: currentOrder,
      orderId: currentOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Retry payment error:", error);

    return res.status(500).json({
      message: "Unable to retry payment.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// Admin processes a refund after a return request has been approved.
const processReturnRefund = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.returnRequest?.status !== "Approved") {
      return res.status(400).json({
        message: "The return request must be approved first.",
      });
    }

    if (order.paymentMethod !== "Razorpay") {
      return res.status(400).json({
        message: "This endpoint processes Razorpay refunds only.",
      });
    }

    if (
      order.paymentStatus !== "Paid" ||
      !order.razorpayPaymentId
    ) {
      return res.status(400).json({
        message: "A successfully paid Razorpay payment is required.",
      });
    }

    if (
      order.refundStatus === "Processed" ||
      order.paymentStatus === "Refunded"
    ) {
      return res.status(409).json({
        message: "This order has already been refunded.",
      });
    }

    if (order.refundId) {
      return res.status(409).json({
        message:
          "A refund already exists for this order. Check its status before retrying.",
        refundId: order.refundId,
        refundStatus: order.refundStatus,
      });
    }

    // Claim the refund before calling Razorpay to avoid duplicate requests.
    const claimedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: "Paid",
        "returnRequest.status": "Approved",
        refundStatus: {
          $in: ["Not Applicable", "Failed"],
        },
        refundId: { $in: ["", null] },
      },
      {
        $set: { refundStatus: "Processing" },
      },
      { new: true }
    );

    if (!claimedOrder) {
      return res.status(409).json({
        message:
          "The refund is already being processed or the order has changed.",
      });
    }

    try {
      const refund = await razorpay.payments.refund(
        claimedOrder.razorpayPaymentId,
        {
          amount: Math.round(claimedOrder.totalAmount * 100),
          notes: {
            orderId: claimedOrder._id.toString(),
            reason:
              claimedOrder.returnRequest.reason || "Approved return",
          },
        }
      );

      claimedOrder.refundId = refund.id;
      claimedOrder.refundStatus =
        refund.status === "processed" ? "Processed" : "Pending";

      if (refund.status === "processed") {
        claimedOrder.paymentStatus = "Refunded";
        claimedOrder.refundedAt = new Date();
        claimedOrder.returnRequest.status = "Completed";
        claimedOrder.status = "Returned";
      }

      await claimedOrder.save();

      return res.status(200).json({
        message: "Refund request submitted successfully.",
        refundId: refund.id,
        refundStatus: claimedOrder.refundStatus,
        order: claimedOrder,
      });
    } catch (refundError) {
      console.error("Razorpay refund API error:", refundError);

      // Do not automatically retry an uncertain refund request.
      return res.status(502).json({
        message:
          "The refund result could not be confirmed. Check Razorpay before retrying.",
      });
    }
  } catch (error) {
    console.error("Process return refund error:", error);

    return res.status(500).json({
      message: "Unable to process refund.",
    });
  }
};

// Razorpay webhook for asynchronous refund status updates.
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET.");
      return res.status(500).send("Webhook configuration error");
    }

    // Razorpay signs the exact raw request body.
    if (!Buffer.isBuffer(req.body) || !signature) {
      return res.status(400).send("Invalid webhook request");
    }

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return res.status(400).send("Invalid webhook signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).send("Invalid webhook signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));

    const supportedEvents = [
      "refund.created",
      "refund.processed",
      "refund.failed",
      "payment.failed",
      "payment.captured",
    ];

    if (!supportedEvents.includes(event.event)) {
      return res.status(200).json({
        message: "Event acknowledged.",
      });
    }

    if (event.event === "payment.failed" || event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (!payment?.id || !payment?.order_id) {
        return res.status(400).send("Payment details missing");
      }

      const order = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });
      if (!order) {
        return res.status(200).json({ message: "No matching order found." });
      }

      if (event.event === "payment.failed") {
        const failedOrder = await releaseOrderReservation(
          order._id,
          "Razorpay payment failed",
          null,
          { paymentStatus: "Failed" }
        );
        if (!failedOrder && order.paymentStatus === "Pending") {
          await Order.updateOne(
            { _id: order._id, paymentStatus: "Pending", inventoryStatus: "Released" },
            { $set: { paymentStatus: "Failed" } }
          );
        }
        return res.status(200).json({ message: "Payment failure acknowledged." });
      }

      if (
        payment.status !== "captured" ||
        payment.currency !== "INR" ||
        payment.amount !== Math.round(order.totalAmount * 100)
      ) {
        return res.status(400).send("Captured payment details do not match");
      }
      if (
        order.paymentStatus === "Paid" &&
        order.razorpayPaymentId === payment.id
      ) {
        return res.status(200).json({ message: "Payment event already processed." });
      }
      try {
        if (!(await ensureOrderReservation(order))) {
          console.error("Captured payment could not reserve inventory:", order._id);
          return res.status(200).json({
            message: "Captured payment requires manual inventory review.",
          });
        }
      } catch (error) {
        console.error("Captured payment inventory reservation failed:", error);
        return res.status(200).json({
          message: "Captured payment requires manual inventory review.",
        });
      }
      const paidOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: "Pending",
          inventoryStatus: "Reserved",
          status: { $nin: ["Cancelled", "Returned"] },
        },
        {
          $set: {
            razorpayPaymentId: payment.id,
            paymentStatus: "Paid",
            status: "Confirmed",
            inventoryStatus: "Committed",
            reservationExpiresAt: null,
          },
        },
        { new: true }
      );
      if (!paidOrder) {
        const currentOrder = await Order.findById(order._id);
        if (
          currentOrder?.paymentStatus === "Paid" &&
          currentOrder.razorpayPaymentId === payment.id
        ) {
          return res.status(200).json({ message: "Payment event already processed." });
        }
        console.error("Captured payment has no active inventory reservation:", order._id);
      }
      return res.status(200).json({ message: "Payment event acknowledged." });
    }

    const refund = event.payload?.refund?.entity;

    if (!refund?.id || !refund?.payment_id) {
      return res.status(400).send("Refund details missing");
    }

    const order = await Order.findOne({
      razorpayPaymentId: refund.payment_id,
    });

    if (!order) {
      console.warn(
        "No order found for refund payment:",
        refund.payment_id
      );

      return res.status(200).json({
        message: "No matching order found.",
      });
    }

    if (order.refundId && order.refundId !== refund.id) {
      console.error("Refund ID mismatch for order:", order._id);

      return res.status(200).json({
        message: "Refund ID mismatch requires manual review.",
      });
    }

    // Do not let delayed events reverse a completed refund.
    if (
      order.refundStatus === "Processed" &&
      event.event !== "refund.processed"
    ) {
      return res.status(200).json({
        message: "Refund is already processed.",
      });
    }

    order.refundId = refund.id;

    if (event.event === "refund.created") {
      order.refundStatus = "Pending";
    }

    if (event.event === "refund.processed") {
      order.refundStatus = "Processed";
      order.paymentStatus = "Refunded";
      order.refundedAt = new Date();

      if (order.returnRequest?.status === "Approved") {
        order.returnRequest.status = "Completed";
        order.status = "Returned";
      }
    }

    if (event.event === "refund.failed") {
      order.refundStatus = "Failed";
    }

    await order.save();

    return res.status(200).json({
      message: "Refund status synchronized.",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return res.status(500).send("Webhook processing failed");
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  retryPayment,
  processReturnRefund,
  handleRazorpayWebhook,
};
