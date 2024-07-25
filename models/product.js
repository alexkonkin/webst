const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

// Define the Mongoose schema for the Product
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50,
        unique: true
    },
    description: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    price: {
        type: Number,
        required: true,
        min: 0, // Ensure the price is a positive number
        set: v => (typeof v === 'number' ? parseFloat(v.toFixed(2)) : v) // Ensure two decimal places
    },
    pictures: {
        type: [String], // Array of strings for picture URLs
        validate: {
            validator: function (v) {
                // Ensure each string in the array is a valid URL
                return v.every(url => /^https?:\/\/.+/.test(url));
            },
            message: 'Each picture URL must be a valid URL'
        },
        default: []
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category' // Assuming you have a Category model
    },
    stock_quantity: {
        type: Number,
        required: true,
        min: 0 // Ensure the stock quantity is a non-negative integer
    }
});

const Product = mongoose.model('Product', productSchema);

// Define the Joi schema for product validation
const validateProduct = (product) => {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        description: Joi.string().min(5).max(255).required(),
        price: Joi.number().positive().precision(2).required(), // Ensure positive price with 2 decimal places
        pictures: Joi.array().items(Joi.string().uri()).optional(), // Array of valid URLs
        category_id: Joi.string().length(24).hex().required(), // Ensure it's a valid ObjectId
        stock_quantity: Joi.number().integer().min(0).required() // Non-negative integer
    });

    return schema.validate(product);
};

exports.Product = Product;
exports.validate = validateProduct;
