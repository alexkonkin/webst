const Joi = require('joi');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const error = require('../middleware/error');
const logger = require('../startup/logging'); // Adjust the path as necessary
const { User } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        logger.info('Received authentication request', { email: req.body.email });

        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            logger.info('User not found', { email: req.body.email });
            return res.status(400).send('Invalid email or password.');
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password_hash);
        if (!validPassword) {
            logger.info('Invalid password', { email: req.body.email });
            return res.status(400).send('Invalid email or password.');
        }

        const token = user.generateAuthToken();
        logger.info('Authentication successful', { email: req.body.email });
        res.send(token);
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

function validate(req) {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });

    return schema.validate(req);
}

module.exports = router;
