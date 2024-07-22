const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
    }
});

const Category = mongoose.model('Category', categorySchema);

const validateCategory = (category) => {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        description: Joi.string().min(5).max(255).required()
    });

    return schema.validate(category);
};

exports.Category = Category;
exports.validate = validateCategory;