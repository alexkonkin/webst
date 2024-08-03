const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('config');
const logger = require('../startup/logging');
const { User, validate } = require('../models/user');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service provider
    auth: {
        user: config.get('mail.user'), // Your email
        pass: config.get('mail.password') // Your email password or app-specific password
    }
});

router.post('/register', async (req, res, next) => {
    try {
        // Validate the user input
        logger.info('Validating user input for registration');
        const { error } = validate(req.body);
        if (error) {
            logger.info('Validation failed for new user registration', { error: error.details[0].message });
            return res.status(400).send(error.details[0].message);
        }

        // Check if the user already exists
        logger.info('Checking if user already exists', { email: req.body.email });
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            logger.info('User already registered', { email: req.body.email });
            return res.status(400).send('User already registered.');
        }

        // Create a new user instance
        logger.info('Creating new user instance', { username: req.body.username, email: req.body.email });
        const verificationToken = jwt.sign({ email: req.body.email }, 'your_jwt_private_key', { expiresIn: '1h' });
        user = new User({
            username: req.body.username,
            email: req.body.email,
            password_hash: req.body.password,
            isVerified: false,
            isAdmin: req.body.isAdmin || false,
            verificationToken: verificationToken
        });

        // Hash the password before saving to the database
        logger.info('Hashing password for new user', { username: req.body.username });
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(req.body.password, salt);

        // Save the user to the database
        logger.info('Saving new user to database', { username: req.body.username, email: req.body.email });
        await user.save();

        // Send verification email
        logger.info('Sending verification email', { email: user.email });
        const mailOptions = {
            from: 'mbox0077@gmail.com',
            to: user.email,
            subject: 'Email Verification',
            text: `Click on the following link to verify your email: http://localhost:3000/api/register/verify/${verificationToken}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error('Error sending verification email', { error: error.message });
                return res.status(500).send('Error sending email.' + error);
            } else {
                logger.info('Verification email sent', { email: user.email });
                res.send('Verification email sent.');
            }
        });
    } catch (err) {
        next(err); // Pass the error to the error handling middleware
    }
});

router.get('/verify/:token', async (req, res, next) => {
    try {
        logger.info('Verifying user email with token', { token: req.params.token });
        const decoded = jwt.verify(req.params.token, 'your_jwt_private_key');
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            logger.info('Invalid token or user', { token: req.params.token });
            return res.status(400).send('Invalid token or user.');
        }

        if (user.isVerified) {
            logger.info('User already verified', { email: user.email });
            return res.status(400).send('User already verified.');
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        logger.info('Email verified successfully', { email: user.email });
        res.send('Email verified successfully.');
    } catch (ex) {
        next(ex); // Pass the error to the error handling middleware
    }
});

module.exports = router;
