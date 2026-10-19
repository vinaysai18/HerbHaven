const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        price: {
            type: Number,
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        image: {
            type: String,
            required: true
        },

        sku: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 100,
            unique: true,
            sparse: true
        },

        category: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "Other"
        },

        stockQuantity: {
            type: Number,
            min: 0,
            default: 0,
            validate: Number.isSafeInteger
        },

        lowStockThreshold: {
            type: Number,
            min: 0,
            default: 5,
            validate: Number.isSafeInteger
        }
    },
    {
        timestamps: true
    }
);

productSchema.pre("validate", function assignSku() {
    if (!this.sku) {
        this.sku = `HH-${this._id.toString().toUpperCase()}`;
    }
});

module.exports = mongoose.model("Product", productSchema);