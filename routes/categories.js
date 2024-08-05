const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logging');
const { Category, validate } = require('../models/category');
const mongoose = require('mongoose');
const express = require('express');
const { Product } = require('../models/product');
const router = express.Router();

// GET route to retrieve all categories, sorted by name
router.get('/', async (req, res, next) => {
    try {
        logger.info('Obtaining the full list of categories');
        const categories = await Category.find().sort('name');
        logger.info('Categories retrieved successfully', { count: categories.length });
        res.send(categories);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

// POST route to create a new category
router.post('/', [auth, admin], async (req, res, next) => {
    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new category', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        const { name, description } = req.body;
        logger.info('Creating new category', { name, description });

        let category = new Category({
            name,
            description
        });

        category = await category.save();
        logger.info('Category created successfully', { id: category._id });
        res.send(category);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

// PUT route to update a category by ID
router.put('/:id', [auth, admin], async (req, res, next) => {
    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for updating category', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        const { name, description } = req.body;
        logger.info('Updating category', { id: req.params.id, name, description });

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true }
        );

        if (!category) {
            logger.info('Category not found', { id: req.params.id });
            return res.status(404).send('The category with the given ID was not found.');
        }

        logger.info('Category updated successfully', { id: category._id });
        res.send(category);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

// DELETE route to delete a category by ID
router.delete('/:id', [auth, admin], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info('Deleting category', { id: req.params.id });

        const productCount = await Product.countDocuments({ category_id: req.params.id }).session(session);
        if (productCount > 0) {
            logger.info('Cannot delete category associated with existing products', { id: req.params.id, productCount });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Cannot delete the category as it is associated with existing products. Count: ' + productCount);
        }

        const category = await Category.findByIdAndDelete(req.params.id).session(session);
        if (!category) {
            logger.info('Category not found for deletion', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The category with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Category deleted successfully', { id: category._id });
        res.send(category);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);  // Pass the error to the error handling middleware
    }
});

module.exports = router;
