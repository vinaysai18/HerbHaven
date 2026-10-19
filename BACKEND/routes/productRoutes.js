const express = require("express");

const {
    getProducts,
    addProduct,
    editProduct,
    deleteProduct
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const inventoryController = require("../controllers/inventoryController");

const router = express.Router();

// GET all products
router.get("/", protect, getProducts);

router.get(
    "/inventory",
    protect,
    adminOnly,
    inventoryController.getInventory
);
router.get(
    "/inventory/:id/history",
    protect,
    adminOnly,
    inventoryController.getInventoryHistory
);
router.post(
    "/inventory/:id/adjust",
    protect,
    adminOnly,
    inventoryController.adjustInventory
);
router.put(
    "/inventory/:id/threshold",
    protect,
    adminOnly,
    inventoryController.updateThreshold
);

// ADD product with image
router.post(
    "/",
    protect,
    adminOnly,
    upload.single("image"),
    addProduct
);

// UPDATE product with optional new image
router.put(
    "/:id",
    protect,
    adminOnly,
    upload.single("image"),
    editProduct
);

// DELETE product
router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteProduct
);

module.exports = router;