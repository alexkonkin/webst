const { Order, validate } = require('../models/order');
const { User } = require('../models/user');
const { Product } = require('../models/product');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort('order_date');
        res.send(orders);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// GET route to retrieve a specific order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send('The order with the given ID was not found.');
        res.send(order);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// POST route to create a new order
router.post('/', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { user_id, products, total_price, order_date, status } = req.body;

        const user = await User.findById(user_id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        for (const item of products) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) {
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
        res.send(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating order:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// PUT route to update an existing order
router.put('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { user_id, products, total_price, order_date, status } = req.body;

        const user = await User.findById(user_id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        for (const item of products) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) {
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
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The order with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(order);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error updating order:', err);
        res.status(500).send('Internal Server Error: ' + err);
    }
});

// DELETE route to delete an order
router.delete('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findByIdAndDelete(req.params.id).session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The order with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting order:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

module.exports = router;
