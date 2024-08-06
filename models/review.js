const Joi = require('joi');
const mongoose = require('mongoose');

// Define the Mongoose schema for the Review
const reviewSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product' // Assuming you have a Product model
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming you have a User model
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Ensure the rating is between 1 and 5
        max: 5
    },
    comment: {
        type: String,
        maxlength: 1024 // Optional, but if present, should not exceed 1024 characters
    },
    review_date: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);

// Define the Joi schema for review validation
const validateReview = (review) => {
    const schema = Joi.object({
        product_id: Joi.string().length(24).hex().required(), // Ensure it's a valid ObjectId
        user_id: Joi.string().length(24).hex().required(), // Ensure it's a valid ObjectId
        rating: Joi.number().integer().min(1).max(5).required(), // Ensure rating is between 1 and 5
        comment: Joi.string().max(1024).optional(), // Optional, but if present, max length is 1024
        review_date: Joi.date().optional() // Optional, default is current date
    });

    return schema.validate(review);
};

exports.Review = Review;
exports.validate = validateReview;
