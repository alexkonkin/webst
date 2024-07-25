const { Review, validate } = require('../models/review');
const { Product } = require('../models/product');
const { User } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find().sort('review_date');
        res.send(reviews);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// GET route to retrieve a specific review by ID
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).send('The review with the given ID was not found.');
        res.send(review);
    } catch (error) {
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// POST route to create a new review
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

        const { product_id, user_id, rating, comment, review_date } = req.body;

        const user = await User.findById(user_id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        const product = await Product.findById(product_id).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid product ID.');
        }

        let review = new Review({
            product_id,
            user_id,
            rating,
            comment,
            review_date
        });

        review = await review.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.send(review);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating review:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// PUT route to update a review
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

        const { product_id, user_id, rating, comment, review_date } = req.body;

        const user = await User.findById(user_id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        const product = await Product.findById(product_id).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid product ID.');
        }

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            {
                product_id,
                user_id,
                rating,
                comment,
                review_date
            },
            { new: true, session }
        );

        if (!review) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The review with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(review);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error updating review:', err);
        res.status(500).send('Internal Server Error: ' + err);
    }
});

// DELETE route to delete a review
router.delete('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findByIdAndDelete(req.params.id).session(session);
        if (!review) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The review with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(review);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting review:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

module.exports = router;
