const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logging');
const { Product, validate } = require('../models/product');
const { Review } = require('../models/review');
const { Order } = require('../models/order');
const { Category } = require('../models/category');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all products, sorted by name
router.get('/', async (req, res, next) => {
    try {
        logger.info('Retrieving all products');
        const products = await Product.find().sort('name');
        logger.info('Products retrieved successfully', { count: products.length });
        res.send(products);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// GET route to retrieve a Product by ID
router.get('/:id', async (req, res, next) => {
    try {
        logger.info('Retrieving product by ID', { id: req.params.id });
        const product = await Product.findById(req.params.id);
        if (!product) {
            logger.info('Product not found', { id: req.params.id });
            return res.status(404).send('The Product with the given ID was not found.');
        }
        logger.info('Product retrieved successfully', { id: req.params.id });
        res.send(product);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

// POST route to create a new Product
router.post('/', [auth, admin], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new product', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { name, description, price, pictures, category_id, stock_quantity } = req.body;

        const category = await Category.findById(category_id).session(session);
        if (!category) {
            logger.error('Invalid category ID in product definition ', { category_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid Category Id ' + category_id);
        }

        logger.info('Creating new product', { name, description, price, category_id, stock_quantity });

        let product = new Product({
            name,
            description,
            price,
            pictures,
            category_id,
            stock_quantity
        });

        product = await product.save({ session });
        await session.commitTransaction();
        session.endSession();
        logger.info('Product created successfully', { id: product._id });
        res.send(product);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

// PUT route to update a Product by ID
router.put('/:id', [auth, admin], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for updating product', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { name, description, price, pictures, category_id, stock_quantity } = req.body;

        const category = await Category.findById(category_id).session(session);
        if (!category) {
            logger.error('Invalid category ID in product definition ', { category_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('Invalid Category Id ' + category_id);
        }

        logger.info('Updating product', { id: req.params.id, name, description, price, category_id, stock_quantity });

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { name, description, price, pictures, category_id, stock_quantity },
            { new: true, session }
        );

        if (!product) {
            logger.info('Product not found for updating', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The Product with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Product updated successfully', { id: product._id });
        res.send(product);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err); // Pass the error to the error handling middleware
    }
});

// DELETE route to remove a Product by ID
router.delete('/:id', [auth, admin], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info('Deleting product', { id: req.params.id });

        const reviewCount = await Review.countDocuments({ product_id: req.params.id }).session(session);
        const orderCount = await Order.countDocuments({ product_id: req.params.id }).session(session);

        if (reviewCount > 0 || orderCount > 0) {
            logger.info('Cannot delete product associated with existing reviews or orders', { id: req.params.id, reviewCount, orderCount });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Cannot delete the product as it is associated with existing reviews or orders.');
        }

        const product = await Product.findByIdAndDelete(req.params.id).session(session);
        if (!product) {
            logger.info('Product not found for deletion', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The product with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Product deleted successfully', { id: product._id });
        res.send(product);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

module.exports = router;
