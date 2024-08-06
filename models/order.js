const Joi = require('joi');
const mongoose = require('mongoose');

// Define the Mongoose schema for the Order
const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming you have a User model
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product' // Assuming you have a Product model
        },
        quantity: {
            type: Number,
            required: true,
            min: 1 // Ensure the quantity is at least 1
        },
        price: {
            type: Number,
            required: true,
            min: 0 // Ensure the price is a positive number
        }
    }],
    total_price: {
        type: Number,
        required: true,
        min: 0 // Ensure the total price is a positive number
    },
    order_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
});

const Order = mongoose.model('Order', orderSchema);

// Define the Joi schema for order validation
const validateOrder = (order) => {
    const schema = Joi.object({
        user_id: Joi.string().length(24).hex().required(), // Ensure it's a valid ObjectId
        products: Joi.array().items(Joi.object({
            product_id: Joi.string().length(24).hex().required(), // Ensure it's a valid ObjectId
            quantity: Joi.number().integer().min(1).required(), // Ensure quantity is at least 1
            price: Joi.number().positive().required() // Ensure price is positive
        })).required(),
        total_price: Joi.number().positive().required(), // Ensure total price is positive
        order_date: Joi.date().optional(), // Optional, default is current date
        status: Joi.string().valid('Pending', 'Shipped', 'Delivered', 'Cancelled').required() // Ensure status is one of the specified values
    });

    return schema.validate(order);
};

exports.Order = Order;
exports.validate = validateOrder;
