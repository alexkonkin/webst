const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logging');
const { User, validate } = require('../models/user');
const { Review } = require('../models/review');
const { Order } = require('../models/order');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// GET route to retrieve all users
router.get('/', async (req, res, next) => {
    try {
        logger.info('Retrieving all users');
        const users = await User.find().sort('username');
        logger.info('Users retrieved successfully', { count: users.length });
        res.send(users);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// GET route to retrieve a specific user by ID
router.get('/:id', async (req, res, next) => {
    try {
        logger.info('Retrieving user by ID', { id: req.params.id });
        const user = await User.findById(req.params.id);
        if (!user) {
            logger.info('User not found', { id: req.params.id });
            return res.status(404).send('The user with the given ID was not found.');
        }
        logger.info('User retrieved successfully', { id: req.params.id });
        res.send(user);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// POST route to create a new user
router.post('/', [auth, admin], async (req, res, next) => {
    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new user', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        logger.info('Checking if user already exists', { email: req.body.email });
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            logger.info('User already registered', { email: req.body.email });
            return res.status(400).send('User already registered.');
        }

        const salt = await bcrypt.genSalt(10);

        user = new User({
            username: req.body.username,
            email: req.body.email,
            password_hash: await bcrypt.hash(req.body.password, salt),
            isAdmin: req.body.isAdmin || false
        });

        logger.info('Saving new user to database', { username: req.body.username, email: req.body.email });
        await user.save();
        logger.info('User created successfully', { id: user._id });
        res.send(user);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// PUT route to update a user
router.put('/:id', [auth, admin], async (req, res, next) => {
    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for updating user', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        const salt = await bcrypt.genSalt(10);

        logger.info('Updating user', { id: req.params.id });
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                username: req.body.username,
                email: req.body.email,
                password_hash: await bcrypt.hash(req.body.password, salt),
                isAdmin: req.body.isAdmin || false
            },
            { new: true }
        );

        if (!user) {
            logger.info('User not found for updating', { id: req.params.id });
            return res.status(404).send('The user with the given ID was not found.');
        }

        logger.info('User updated successfully', { id: user._id });
        res.send(user);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

// DELETE route to delete a user
router.delete('/:id', [auth, admin], async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info('Deleting user', { id: req.params.id });

        const reviewCount = await Review.countDocuments({ user_id: req.params.id }).session(session);
        const orderCount = await Order.countDocuments({ user_id: req.params.id }).session(session);

        if (reviewCount > 0 || orderCount > 0) {
            logger.info('Cannot delete user associated with existing reviews or orders', { id: req.params.id, reviewCount, orderCount });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Cannot delete the user as it is associated with existing reviews or orders.');
        }

        const user = await User.findByIdAndDelete(req.params.id).session(session);
        if (!user) {
            logger.info('User not found for deletion', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The user with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('User deleted successfully', { id: user._id });
        res.send(user);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

module.exports = router;
