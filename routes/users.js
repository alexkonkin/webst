const { User, validate } = require('../models/user');
const { Review } = require('../models/review');
const { Order } = require('../models/order');
const mongoose = require('mongoose');
const express = require('express');
//const bcrypt = require('bcrypt');
const router = express.Router();

// GET route to retrieve all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort('username');
        res.send(users);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// GET route to retrieve a specific user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('The user with the given ID was not found.');
        res.send(user);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// POST route to create a new user
router.post('/', async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        let user = await User.findOne({ email: req.body.email });
        if (user) return res.status(400).send('User already registered.');

        user = new User({
            username: req.body.username,
            email: req.body.email,
            password_hash: /*await bcrypt.hash(req.body.password, 10)*/req.body.password,
            isAdmin: req.body.isAdmin || false
        });

        await user.save();
        res.send(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// PUT route to update a user
router.put('/:id', async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                username: req.body.username,
                email: req.body.email,
                password_hash: /*await bcrypt.hash(req.body.password, 10)*/req.body.password,
                isAdmin: req.body.isAdmin || false
            },
            { new: true }
        );

        if (!user) return res.status(404).send('The user with the given ID was not found.');
        res.send(user);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Internal Server Error: ' + err);
    }
});

// DELETE route to delete a user
router.delete('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const reviewCount = await Review.countDocuments({ user_id: req.params.id }).session(session);
        const orderCount = await Order.countDocuments({ user_id: req.params.id }).session(session);

        if (reviewCount > 0 || orderCount > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Cannot delete the user as it is associated with existing reviews or orders.');
        }

        const user = await User.findByIdAndDelete(req.params.id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The user with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(user);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting user:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

module.exports = router;
