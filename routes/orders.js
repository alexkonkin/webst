const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logging');
const { Order, validate } = require('../models/order');
const { User } = require('../models/user');
const { Product } = require('../models/product');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all orders
router.get('/', [auth], async (req, res, next) => {
    try {
        logger.info('Retrieving all orders');
        const orders = await Order.find().sort('order_date');
        logger.info('Orders retrieved successfully', { count: orders.length });
        res.send(orders);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// GET route to retrieve a specific order by ID
router.get('/:id', [auth], async (req, res, next) => {
    try {
        logger.info('Retrieving order by ID', { id: req.params.id });
        const order = await Order.findById(req.params.id);
        if (!order) {
            logger.info('Order not found', { id: req.params.id });
            return res.status(404).send('The order with the given ID was not found.');
        }
        logger.info('Order retrieved successfully', { id: req.params.id });
        res.send(order);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// POST route to create a new order
router.post('/', [auth], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new order', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { user_id, products, total_price, order_date, status } = req.body;
        logger.info('Creating new order', { user_id, total_price, order_date, status });

        const user = await User.findById(user_id).session(session);
        if (!user) {
            logger.info('Invalid user ID for new order', { user_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        for (const item of products) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) {
                logger.info('Invalid product ID for new order', { product_id: item.product_id });
                await session.abortTransaction();
                session.endSession();
                return res.status(400).send(`Invalid product ID: ${item.product_id}`);
            }
        }

        let order = new Order({
            user_id,
            products,
            total_price,
            order_date,
            status
        });

        order = await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        logger.info('Order created successfully', { id: order._id });
        res.send(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

// PUT route to update an existing order
router.put('/:id', [auth], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for updating order', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { user_id, products, total_price, order_date, status } = req.body;
        logger.info('Updating order', { id: req.params.id, user_id, total_price, order_date, status });

        const user = await User.findById(user_id).session(session);
        if (!user) {
            logger.info('Invalid user ID for updating order', { user_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        for (const item of products) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) {
                logger.info('Invalid product ID for updating order', { product_id: item.product_id });
                await session.abortTransaction();
                session.endSession();
                return res.status(400).send(`Invalid product ID: ${item.product_id}`);
            }
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                user_id,
                products,
                total_price,
                order_date,
                status
            },
            { new: true, session }
        );

        if (!order) {
            logger.info('Order not found for updating', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The order with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Order updated successfully', { id: order._id });
        res.send(order);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err); // Pass the error to the error handling middleware
    }
});

// DELETE route to delete an order
router.delete('/:id', [auth], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info('Deleting order', { id: req.params.id });

        const order = await Order.findByIdAndDelete(req.params.id).session(session);
        if (!order) {
            logger.info('Order not found for deletion', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The order with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Order deleted successfully', { id: order._id });
        res.send(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

module.exports = router;
