const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models/user');
let server;

jest.mock('nodemailer');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
//jest.mock('config');

const mockTransport = {
    sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
        callback(null, { response: '250 OK' });
    })
};

nodemailer.createTransport.mockReturnValue(mockTransport);

describe('/api/register', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        await User.deleteMany({});
        await server.close();
    });

    describe('POST /register', () => {
        it('should return 400 if user input is invalid', async () => {
            const res = await request(server)
                .post('/api/register/register')
                .send({ email: 'invalid-email' });

            expect(res.status).toBe(400);
        });

        it('should return 400 if user is already registered', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();

            const res = await request(server)
                .post('/api/register/register')
                .send({ username: 'user1', email: 'user1@example.com', password: 'password1' });

            expect(res.status).toBe(400);
            expect(res.text).toContain('User already registered.');
        });

        it('should save the user and send verification email if input is valid', async () => {
            bcrypt.genSalt.mockResolvedValue(10);
            bcrypt.hash.mockResolvedValue('hashedpassword1');
            jwt.sign.mockReturnValue('verificationToken');

            const res = await request(server)
                .post('/api/register/register')
                .send({ username: 'user1', email: 'user1@example.com', password: 'password1' });

            const user = await User.findOne({ email: 'user1@example.com' });

            expect(user).not.toBeNull();
            expect(user).toHaveProperty('username', 'user1');
            expect(user).toHaveProperty('email', 'user1@example.com');
            expect(user).toHaveProperty('password_hash', 'hashedpassword1');
            expect(user).toHaveProperty('verificationToken', 'verificationToken');
            expect(res.text).toContain('Verification email sent.');
        });

        it('should return 500 if email sending fails', async () => {
            mockTransport.sendMail.mockImplementationOnce((mailOptions, callback) => {
                callback(new Error('Email sending failed'));
            });

            const res = await request(server)
                .post('/api/register/register')
                .send({ username: 'user1', email: 'user1@example.com', password: 'password1' });

            expect(res.status).toBe(500);
            expect(res.text).toContain('Error sending email.');
        });
    });

    describe('GET /verify/:token', () => {
        it('should return 400 if token is invalid', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token') });

            const res = await request(server).get('/api/register/verify/invalidtoken');

            expect(res.status).toBe(400);
        });

        it('should return 400 if user is not found', async () => {
            jwt.verify.mockReturnValue({ email: 'user1@example.com' });

            const res = await request(server).get('/api/register/verify/validtoken');

            expect(res.status).toBe(400);
            expect(res.text).toContain('Invalid token or user.');
        });

        it('should return 400 if user is already verified', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1', isVerified: true });
            await user.save();
            jwt.verify.mockReturnValue({ email: 'user1@example.com' });

            const res = await request(server).get('/api/register/verify/validtoken');

            expect(res.status).toBe(400);
            expect(res.text).toContain('User already verified.');
        });

        it('should verify user if token is valid and user exists', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1', isVerified: false, verificationToken: 'validtoken' });
            await user.save();
            jwt.verify.mockReturnValue({ email: 'user1@example.com' });

            const res = await request(server).get('/api/register/verify/validtoken');

            const verifiedUser = await User.findOne({ email: 'user1@example.com' });

            expect(verifiedUser.isVerified).toBe(true);
            expect(verifiedUser.verificationToken).toBeNull();
            expect(res.text).toContain('Email verified successfully.');
        });
    });
});
