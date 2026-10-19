
const express = require("express");
const router = express.Router();

const adminOnly = require("../middleware/adminMiddleware");


const {
  createOrder,
  getMyOrders,
  cancelOrder,
  returnOrder,
  getAllOrders,
  updateOrderStatus,
  reviewReturnRequest,
  confirmReturnReceived,
} = require("../controllers/orderController");


const protect = require("../middleware/authMiddleware");

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.put("/:orderId/cancel", protect, cancelOrder);
router.put("/:orderId/return", protect, returnOrder);




router.get("/admin/all", protect, adminOnly, getAllOrders);
router.put(
  "/admin/:orderId/status",
  protect,
  adminOnly,
  updateOrderStatus
);
router.put("/admin/:orderId/return-review", protect, adminOnly, reviewReturnRequest);
router.put(
  "/admin/:orderId/return-received",
  protect,
  adminOnly,
  confirmReturnReceived
);


module.exports = router;
