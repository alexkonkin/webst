const request = require('supertest');
const mongoose = require('mongoose');
const { User } = require('../models/user');
const { Review } = require('../models/review');
const { Order } = require('../models/order');
let server;

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));
jest.mock('../startup/logging');

describe('/api/users', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        if (server && server.close) {
            await server.close();
        }
        await User.deleteMany({});
        await Review.deleteMany({});
        await Order.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all users', async () => {
            await User.collection.insertMany([
                { username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' },
                { username: 'user2', email: 'user2@example.com', password_hash: 'hashedpassword2' }
            ]);

            const res = await request(server).get('/api/users');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(u => u.username === 'user1')).toBeTruthy();
            expect(res.body.some(u => u.username === 'user2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return a user if a valid ID is passed', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();

            const res = await request(server).get('/api/users/' + user._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username', user.username);
        });

        it('should return 404 if an invalid ID is passed', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/users/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        it('should return 400 if user is invalid', async () => {
            const res = await request(server)
                .post('/api/users')
                .send({ email: 'user1@example.com', username: 'user1', password: false });

            expect(res.status).toBe(400);
        });

        it('should save the user if it is valid', async () => {
            const res = await request(server)
                .post('/api/users')
                .send({ email: 'user2@example.com', username: 'user2', password: 'password1' });

            const user = await User.findOne({ email: 'user2@example.com' })

            expect(user).not.toBeNull();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('username', 'user2');
        });
    });

    describe('PUT /:id', () => {
        it('should return 400 if user is invalid', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();

            const res = await request(server)
                .put('/api/users/' + user._id)
                .send({ email: 'user1@example.com', password_hash: user.password_hash, username: user.username });

            expect(res.status).toBe(400);
        });

        it('should return 404 if user is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .put('/api/users/' + id)
                .send({ username: 'user1', email: 'user1@example.com', password: 'password1' });

            expect(res.status).toBe(404);
        });

        it('should update the user if it is valid', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();

            const res = await request(server)
                .put('/api/users/' + user._id)
                .send({ username: 'updatedName', email: 'updated@example.com', password: 'updatedpassword' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('username', 'updatedName');
            expect(res.body).toHaveProperty('email', 'updated@example.com');
        });
    });

    describe('DELETE /:id', () => {
        it('should return 404 if user is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete('/api/users/' + id);

            expect(res.status).toBe(404);
        });

        it('should return 400 if user is associated with reviews or orders', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();
            await Review.create({ product_id: new mongoose.Types.ObjectId(), user_id: user._id, rating: 5, comment: 'Great!', review_date: new Date() });
            await Order.create({ user_id: user._id, products: [{ product_id: new mongoose.Types.ObjectId(), quantity: 1, price: 100 }], total_price: 100, order_date: new Date(), status: 'Pending' });

            const res = await request(server)
                .delete('/api/users/' + user._id);

            expect(res.status).toBe(400);
        });

        it('should delete the user if it is valid', async () => {
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword1' });
            await user.save();

            const res = await request(server)
                .delete('/api/users/' + user._id);

            expect(res.status).toBe(200);
            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });
    });
});
