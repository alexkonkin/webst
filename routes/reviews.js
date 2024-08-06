const { Review, validate } = require('../models/review');
const { Product } = require('../models/product');
const logger = require('../startup/logging');
const { User } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all reviews
router.get('/', async (req, res, next) => {
    try {
        logger.info('Retrieving all reviews');
        const reviews = await Review.find().sort('review_date');
        logger.info('Reviews retrieved successfully', { count: reviews.length });
        res.send(reviews);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// GET route to retrieve a specific review by ID
router.get('/:id', async (req, res, next) => {
    try {
        logger.info('Retrieving review by ID', { id: req.params.id });
        const review = await Review.findById(req.params.id);
        if (!review) {
            logger.info('Review not found', { id: req.params.id });
            return res.status(404).send('The review with the given ID was not found.');
        }
        logger.info('Review retrieved successfully', { id: req.params.id });
        res.send(review);
    } catch (error) {
        next(error); // Pass the error to the error handling middleware
    }
});

// POST route to create a new review
router.post('/', async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new review', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { product_id, user_id, rating, comment, review_date } = req.body;
        logger.info('Creating new review', { product_id, user_id, rating });

        const user = await User.findById(user_id).session(session);
        if (!user) {
            logger.info('Invalid user ID for new review', { user_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        const product = await Product.findById(product_id).session(session);
        if (!product) {
            logger.info('Invalid product ID for new review', { product_id });
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
        logger.info('Review created successfully', { id: review._id });
        res.send(review);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

// PUT route to update a review
router.put('/:id', async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for updating review', { error: error.details[0].message });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send(error.details[0].message);
        }

        const { product_id, user_id, rating, comment, review_date } = req.body;
        logger.info('Updating review', { id: req.params.id, product_id, user_id, rating });

        const user = await User.findById(user_id).session(session);
        if (!user) {
            logger.info('Invalid user ID for updating review', { user_id });
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Invalid user ID.');
        }

        const product = await Product.findById(product_id).session(session);
        if (!product) {
            logger.info('Invalid product ID for updating review', { product_id });
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
            logger.info('Review not found for updating', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The review with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Review updated successfully', { id: review._id });
        res.send(review);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err); // Pass the error to the error handling middleware
    }
});

// DELETE route to delete a review
router.delete('/:id', async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        logger.info('Deleting review', { id: req.params.id });
        const review = await Review.findByIdAndDelete(req.params.id).session(session);
        if (!review) {
            logger.info('Review not found for deletion', { id: req.params.id });
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The review with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        logger.info('Review deleted successfully', { id: review._id });
        res.send(review);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error); // Pass the error to the error handling middleware
    }
});

module.exports = router;
