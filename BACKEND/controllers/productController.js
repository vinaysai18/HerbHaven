const Product = require("../models/Product");

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
        const { name, price, description } = req.body;

        if (!name || price === undefined || !description || !req.file) {
            return res.status(400).json({
                message: "Name, price, description, and image are required."
            });
        }

        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                message: "Please provide a valid price."
            });
        }

        const product = await Product.create({
            name,
            price: numericPrice,
            description,
            image: `/uploads/${req.file.filename}`
        });

        res.status(201).json({
            message: "Product added successfully!",
            product
        });
    } catch (error) {
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