const request = require('supertest');
const mongoose = require('mongoose');
const { Review } = require('../models/review');
const { Product } = require('../models/product');
const { User } = require('../models/user');
let server;

jest.mock('../startup/logging');

describe('/api/reviews', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        await server.close();
        await Review.deleteMany({});
        await Product.deleteMany({});
        await User.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all reviews', async () => {
            await Review.collection.insertMany([
                { product_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId(), rating: 5, comment: 'Great!', review_date: new Date() },
                { product_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId(), rating: 4, comment: 'Good', review_date: new Date() }
            ]);

            const res = await request(server).get('/api/reviews');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(r => r.comment === 'Great!')).toBeTruthy();
            expect(res.body.some(r => r.comment === 'Good')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return a review if a valid ID is passed', async () => {
            const review = new Review({ product_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId(), rating: 5, comment: 'Great!', review_date: new Date() });
            await review.save();

            const res = await request(server).get('/api/reviews/' + review._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('comment', review.comment);
        });

        it('should return 404 if an invalid ID is passed', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/reviews/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        it('should return 400 if review is invalid', async () => {
            const res = await request(server)
                .post('/api/reviews')
                .send({ comment: 'Great!' });

            expect(res.status).toBe(400);
        });

        it('should save the review if it is valid', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword' });
            await user.save();

            const reviewData = { product_id: product._id.toString(), user_id: user._id.toString(), rating: 5, comment: 'Great!', review_date: new Date() };

            const res = await request(server)
                .post('/api/reviews')
                .send(reviewData);

            const review = await Review.find({ comment: 'Great!' });

            expect(review).not.toBeNull();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('comment', 'Great!');
        });
    });

    describe('PUT /:id', () => {
        it('should return 400 if review is invalid', async () => {
            const review = new Review({ product_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId(), rating: 5, comment: 'Great!', review_date: new Date() });
            await review.save();

            const res = await request(server)
                .put('/api/reviews/' + review._id)
                .send({ comment: 'Good' });

            expect(res.status).toBe(400);
        });

        it('should return 404 if review is not found', async () => {
            const id = new mongoose.Types.ObjectId();

            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword' });
            await user.save();

            const res = await request(server)
                .put('/api/reviews/' + id)
                .send({ product_id: product._id, user_id: user._id, rating: 4, comment: 'Good', review_date: new Date() });

            expect(res.status).toBe(404);
        });

        it('should update the review if it is valid', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();
            const user = new User({ username: 'user1', email: 'user1@example.com', password_hash: 'hashedpassword' });
            await user.save();

            const review = new Review({ product_id: product._id, user_id: user._id, rating: 5, comment: 'Great!', review_date: new Date() });
            await review.save();

            const res = await request(server)
                .put('/api/reviews/' + review._id)
                .send({ product_id: review.product_id, user_id: review.user_id, rating: 4, comment: 'Good', review_date: new Date() });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('comment', 'Good');
            expect(res.body).toHaveProperty('rating', 4);
        });
    });

    describe('DELETE /:id', () => {
        it('should return 404 if review is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete('/api/reviews/' + id);

            expect(res.status).toBe(404);
        });

        it('should delete the review if it is valid', async () => {
            const review = new Review({ product_id: new mongoose.Types.ObjectId(), user_id: new mongoose.Types.ObjectId(), rating: 5, comment: 'Great!', review_date: new Date() });
            await review.save();

            const res = await request(server)
                .delete('/api/reviews/' + review._id);

            expect(res.status).toBe(200);
            const deletedReview = await Review.findById(review._id);
            expect(deletedReview).toBeNull();
        });
    });
});
