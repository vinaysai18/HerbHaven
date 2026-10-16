const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// Support either direct exports or named exports.
const createPaymentOrder =
  paymentController.createPaymentOrder;

const verifyPayment =
  paymentController.verifyPayment;

const retryPayment =
  paymentController.retryPayment;

const processReturnRefund =
  paymentController.processReturnRefund;

const authProtect =
  typeof protect === "function"
    ? protect
    : protect.protect;

const requireAdmin =
  typeof adminOnly === "function"
    ? adminOnly
    : adminOnly.adminOnly || adminOnly.admin;

// Check every route handler before registering routes.
const handlers = {
  createPaymentOrder,
  verifyPayment,
  retryPayment,
  processReturnRefund,
  authProtect,
  requireAdmin,
};

for (const [name, handler] of Object.entries(handlers)) {
  if (typeof handler !== "function") {
    throw new TypeError(
      `paymentRoutes.js: "${name}" is not a function. Check its module export.`
    );
  }
}

// Payment routes
router.post("/create-order", authProtect, createPaymentOrder);
router.post("/verify", authProtect, verifyPayment);
router.post("/retry/:orderId", authProtect, retryPayment);

// Admin-only refund processing
router.post(
  "/refund/:orderId",
  authProtect,
  requireAdmin,
  processReturnRefund
);

module.exports = router;