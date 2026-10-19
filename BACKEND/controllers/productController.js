const Product = require("../models/Product");
const InventoryMovement = require("../models/InventoryMovement");
const { isNonNegativeInteger } = require("../services/inventoryService");

// ================= GET ALL PRODUCTS =================

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch products!",
            error: error.message
        });
    }
};

// ================= ADD PRODUCT =================

const addProduct = async (req, res) => {
    try {
        const { name, price, description, stockQuantity, lowStockThreshold, sku, category } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            price === undefined ||
            typeof description !== "string" || !description.trim() ||
            !req.file
        ) {
            return res.status(400).json({
                message: "Name, price, description, and image are required."
            });
        }

        if (
            (typeof price !== "number" && typeof price !== "string") ||
            (typeof price === "string" && !price.trim())
        ) {
            return res.status(400).json({
                message: "Please provide a valid price."
            });
        }
        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                message: "Please provide a valid price."
            });
        }

        const isWholeNumberInput = (value) =>
            (typeof value === "number" ||
                (typeof value === "string" && /^\d+$/.test(value))) &&
            isNonNegativeInteger(Number(value));
        const initialStock = stockQuantity === undefined ? 0 : Number(stockQuantity);
        const threshold = lowStockThreshold === undefined ? 5 : Number(lowStockThreshold);
        if (
            (stockQuantity !== undefined && !isWholeNumberInput(stockQuantity)) ||
            (lowStockThreshold !== undefined && !isWholeNumberInput(lowStockThreshold)) ||
            !isNonNegativeInteger(initialStock) ||
            !isNonNegativeInteger(threshold)
        ) {
            return res.status(400).json({
                message: "Stock and low-stock threshold must be non-negative whole numbers."
            });
        }
        if (
            (sku !== undefined && typeof sku !== "string") ||
            (category !== undefined && typeof category !== "string") ||
            (typeof sku === "string" && sku.trim().length > 100) ||
            (typeof category === "string" && category.trim().length > 100)
        ) {
            return res.status(400).json({
                message: "SKU and category must be text values."
            });
        }

        const product = await Product.create({
            name,
            price: numericPrice,
            description,
            image: `/uploads/${req.file.filename}`,
            stockQuantity: initialStock,
            lowStockThreshold: threshold,
            sku,
            category: category || "Other"
        });

        if (initialStock > 0) {
            await InventoryMovement.create({
                product: product._id,
                quantityChange: initialStock,
                previousQuantity: 0,
                resultingQuantity: initialStock,
                reason: "Initial stock",
                performedBy: req.userId
            });
        }

        res.status(201).json({
            message: "Product added successfully!",
            product
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A product with this SKU already exists."
            });
        }
        res.status(500).json({
            message: "Failed to add product!",
            error: error.message
        });
    }
};

// ================= EDIT PRODUCT =================

const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description } = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found!"
            });
        }

        if (name !== undefined) {
            product.name = name;
        }

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                return res.status(400).json({
                    message: "Please provide a valid price."
                });
            }

            product.price = numericPrice;
        }

        if (description !== undefined) {
            product.description = description;
        }

        // Replace the image only when a new image is uploaded
        if (req.file) {
            product.image = `/uploads/${req.file.filename}`;
        }

        await product.save();

        res.status(200).json({
            message: "Product updated successfully!",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Product update failed!",
            error: error.message
        });
    }
};

// ================= DELETE PRODUCT =================

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found!"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully!",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete product!",
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    addProduct,
    editProduct,
    deleteProduct
};