
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
          default: "",
        },
      },
    ],

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Order and delivery status
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Pending",
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["Razorpay", "COD"],
      required: true,
      default: "Razorpay",
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    inventoryStatus: {
      type: String,
      enum: ["Not Reserved", "Reserving", "Reserved", "Committed", "Released"],
      default: "Not Reserved",
    },

    reservationExpiresAt: {
      type: Date,
      default: null,
    },

    // Razorpay transaction details
    razorpayOrderId: {
      type: String,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    // Return request details
    returnRequest: {
      status: {
        type: String,
        enum: ["None", "Requested", "Approved", "Rejected", "Completed"],
        default: "None",
      },
      reason: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      receivedAt: {
        type: Date,
        default: null,
      },
      adminComment: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },
    },

    // Refund tracking
    refundStatus: {
      type: String,
      enum: ["Not Applicable", "Pending","Processing", "Processed", "Failed"],
      default: "Not Applicable",
    },

    refundId: {
      type: String,
      default: "",
    },

    refundedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);