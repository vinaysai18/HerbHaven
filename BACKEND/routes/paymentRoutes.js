
const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  retryPayment,
  processReturnRefund,
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

router.post("/create-order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);
router.post("/retry/:orderId", protect, retryPayment);

// Admin-only refund processing
router.post(
  "/refund/:orderId",
  protect,
  adminOnly,
  processReturnRefund
);

module.exports = router;
