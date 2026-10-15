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

const router = express.Router();

// GET all products
router.get("/", protect, getProducts);

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