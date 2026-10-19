const mongoose = require("mongoose");
const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const {
  changeStock,
  isNonNegativeInteger,
} = require("../services/inventoryService");

function getStockStatus(product) {
  const quantity = product.stockQuantity || 0;
  const threshold = product.lowStockThreshold ?? 5;
  if (quantity === 0) return "Out of Stock";
  if (quantity <= threshold) return "Low Stock";
  return "In Stock";
}

async function getInventory(req, res) {
  try {
    const { search = "", category = "", status = "", sort = "name" } = req.query;
    const products = await Product.find().sort(
      sort === "stock-asc"
        ? { stockQuantity: 1, name: 1 }
        : sort === "stock-desc"
          ? { stockQuantity: -1, name: 1 }
          : { name: 1 }
    );

    const normalizedSearch = String(search).trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.sku, product.category, product._id].some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearch)
        );
      const matchesCategory =
        !category || product.category === String(category);
      const matchesStatus =
        !status || getStockStatus(product) === String(status);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    const summary = products.reduce(
      (result, product) => {
        const quantity = product.stockQuantity || 0;
        result.totalProducts += 1;
        result.totalUnits += quantity;
        if (getStockStatus(product) === "Low Stock") result.lowStock += 1;
        if (quantity === 0) result.outOfStock += 1;
        return result;
      },
      { totalProducts: 0, totalUnits: 0, lowStock: 0, outOfStock: 0 }
    );

    return res.status(200).json({
      products: filtered.map((product) => ({
        ...product.toObject(),
        stockStatus: getStockStatus(product),
      })),
      summary,
      categories: [...new Set(products.map((product) => product.category || "Other"))].sort(),
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    return res.status(500).json({ message: "Failed to fetch inventory." });
  }
}

async function adjustInventory(req, res) {
  try {
    const { id } = req.params;
    const { quantityChange, reason } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    if (!Number.isSafeInteger(quantityChange) || quantityChange === 0) {
      return res.status(400).json({
        message: "Stock adjustment must be a non-zero whole number.",
      });
    }
    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 300
    ) {
      return res.status(400).json({
        message: "A reason of 1 to 300 characters is required.",
      });
    }

    await changeStock({
      productId: id,
      delta: quantityChange,
      reason: reason.trim(),
      userId: req.userId,
    });
    const product = await Product.findById(id);
    return res.status(200).json({
      message: "Inventory adjusted successfully.",
      product: { ...product.toObject(), stockStatus: getStockStatus(product) },
    });
  } catch (error) {
    const status = error.message === "Product not found." ? 404
      : error.message === "Insufficient stock for this operation." ? 400 : 500;
    if (status === 500) console.error("Adjust inventory error:", error);
    return res.status(status).json({
      message: status === 500 ? "Failed to adjust inventory." : error.message,
    });
  }
}

async function updateThreshold(req, res) {
  try {
    const { id } = req.params;
    const { lowStockThreshold } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    if (!isNonNegativeInteger(lowStockThreshold)) {
      return res.status(400).json({
        message: "Low-stock threshold must be a non-negative whole number.",
      });
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { lowStockThreshold } },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    return res.status(200).json({
      message: "Low-stock threshold updated successfully.",
      product: { ...product.toObject(), stockStatus: getStockStatus(product) },
    });
  } catch (error) {
    console.error("Update inventory threshold error:", error);
    return res.status(500).json({ message: "Failed to update threshold." });
  }
}

async function getInventoryHistory(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }
    if (!(await Product.exists({ _id: id }))) {
      return res.status(404).json({ message: "Product not found." });
    }
    const movements = await InventoryMovement.find({ product: id })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ movements });
  } catch (error) {
    console.error("Get inventory history error:", error);
    return res.status(500).json({ message: "Failed to fetch inventory history." });
  }
}

module.exports = {
  adjustInventory,
  getInventory,
  getInventoryHistory,
  getStockStatus,
  updateThreshold,
};
