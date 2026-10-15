
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Place a Cash on Delivery order
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    // This endpoint is for COD orders only.
    if (paymentMethod !== "COD") {
      return res.status(400).json({
        message: "Select Cash on Delivery or use online payment.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    if (
      typeof deliveryAddress !== "string" ||
      !deliveryAddress.trim()
    ) {
      return res.status(400).json({
        message: "Delivery address is required.",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId } = item;
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product or quantity.",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          message: "A product in your cart no longer exists.",
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Invalid product price.",
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity,
        image: product.image || "",
      });

      totalAmount += price * quantity;
    }

    totalAmount = Number(totalAmount.toFixed(2));

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order amount.",
      });
    }

    const order = await Order.create({
      user: req.userId,
      items: orderItems,
      deliveryAddress: deliveryAddress.trim(),
      totalAmount,
      status: "Pending",
      paymentMethod: "COD",
      paymentStatus: "Pending",
    });

    return res.status(201).json({
      message: "Cash on Delivery order placed successfully.",
      order,
    });
  } catch (error) {
    console.error("Create COD order error:", error);

    return res.status(500).json({
      message: "Failed to place COD order.",
    });
  }
};

// Get orders belonging to the logged-in customer
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.userId,
    })
      .populate("items.product", "image")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch orders.",
    });
  }
};

// Cancel Pending, Confirmed, or Shipped orders
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (
      ["Delivered", "Cancelled", "Returned"].includes(order.status)
    ) {
      return res.status(400).json({
        message:
          order.status === "Delivered"
            ? "Delivered orders cannot be cancelled. Please request a return."
            : "This order cannot be cancelled.",
      });
    }

    order.status = "Cancelled";
    await order.save();

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      message: "Failed to cancel order.",
    });
  }
};

// Return a delivered order

const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        message: "Please provide a reason for the return.",
      });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({
        message: "Return reason cannot exceed 500 characters.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message: "Only delivered orders can be returned.",
      });
    }

    if (
      order.returnRequest &&
      ["Requested", "Approved", "Completed"].includes(
        order.returnRequest.status
      )
    ) {
      return res.status(400).json({
        message: "A return request already exists for this order.",
      });
    }

    order.returnRequest = {
      status: "Requested",
      reason: reason.trim(),
      requestedAt: new Date(),
      reviewedAt: null,
      adminComment: "",
    };

    order.refundStatus =
      order.paymentStatus === "Paid" ? "Pending" : "Not Applicable";

    await order.save();

    return res.status(200).json({
      message: "Return request submitted successfully.",
      order,
    });
  } catch (error) {
    console.error("Return order error:", error);

    return res.status(500).json({
      message: "Failed to submit return request.",
    });
  }
};


const reviewReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, adminComment = "" } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({
        message: "Action must be Approved or Rejected.",
      });
    }

    if (
      typeof adminComment !== "string" ||
      adminComment.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Admin comment must be 500 characters or fewer.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.returnRequest?.status !== "Requested") {
      return res.status(400).json({
        message: "This order has no pending return request.",
      });
    }

    order.returnRequest.status = action;
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.adminComment = adminComment.trim();

    if (action === "Approved") {
      order.refundStatus =
        order.paymentStatus === "Paid" ? "Pending" : "Not Applicable";
    } else {
      order.refundStatus = "Not Applicable";
    }

    await order.save();

    return res.status(200).json({
      message: `Return request ${action.toLowerCase()} successfully.`,
      order,
    });
  } catch (error) {
    console.error("Review return request error:", error);

    return res.status(500).json({
      message: "Failed to review return request.",
    });
  }
};


// Get all orders for admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch all orders.",
    });
  }
};

// Update order status from admin dashboard
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (["Cancelled", "Returned"].includes(order.status)) {
      return res.status(400).json({
        message: `A ${order.status.toLowerCase()} order cannot be updated.`,
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status.",
    });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  cancelOrder,
  returnOrder,
  getAllOrders,
  updateOrderStatus,
  reviewReturnRequest,
};
