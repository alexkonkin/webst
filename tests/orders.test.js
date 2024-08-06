const request = require('supertest');
const mongoose = require('mongoose');
const { Order } = require('../models/order');
const { User } = require('../models/user');
const { Product } = require('../models/product');
const { Category } = require('../models/category');
let server;

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));
jest.mock('../startup/logging');

describe('/api/orders', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        await server.close();
        await Order.deleteMany({});
        await User.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all orders', async () => {
            await Order.collection.insertMany([
                {
                    user_id: new mongoose.Types.ObjectId(), products: [
                        {
                            "name": "Sample Product",
                            "description": "This is a sample product description.",
                            "price": 29.99,
                            "pictures": [
                                "https://example.com/image1.jpg",
                                "https://example.com/image2.jpg"
                            ],
                            "category_id": new mongoose.Types.ObjectId(),
                            "stock_quantity": 100
                        }
                    ], total_price: 100, order_date: new Date(), status: 'Pending'
                },
                {
                    user_id: new mongoose.Types.ObjectId(), products: [
                        {
                            "name": "Sample Product",
                            "description": "This is a sample product description.",
                            "price": 29.99,
                            "pictures": [
                                "https://example.com/image1.jpg",
                                "https://example.com/image2.jpg"
                            ],
                            "category_id": new mongoose.Types.ObjectId(),
                            "stock_quantity": 100
                        }
                    ], total_price: 200, order_date: new Date(), status: 'Completed'
                }
            ]);

            const res = await request(server).get('/api/orders');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(o => o.total_price === 100)).toBeTruthy();
            expect(res.body.some(o => o.total_price === 200)).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return an order if a valid ID is passed', async () => {
            const order = new Order({ user_id: new mongoose.Types.ObjectId(), products: [], total_price: 100, order_date: new Date(), status: 'Pending' });
            await order.save();

            const res = await request(server).get('/api/orders/' + order._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total_price', order.total_price);
        });

        it('should return 404 if an invalid ID is passed', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/orders/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        it('should return 400 if order is invalid', async () => {
            const res = await request(server)
                .post('/api/orders')
                .send({ total_price: 100 });

            expect(res.status).toBe(400);
        });

        it('should save the order if it is valid', async () => {
            const user = new User({ username: 'testuser', email: 'test@test.com', password_hash: '12345' });
            await user.save();

            const category = new Category({ name: 'category1', description: 'description of category1' });
            await category.save();

            const product = new Product({ name: 'product1', description: 'description of the product', price: 100, category_id: category._id, stock_quantity: 10 });
            await product.save();

            const orderData = {
                user_id: user._id,
                products: [{ product_id: product._id, quantity: 1, price: 100 }],
                total_price: 100,
                order_date: new Date(),
                status: 'Pending'
            };

            const res = await request(server)
                .post('/api/orders')
                .send(orderData);

            const order = await Order.find({ user_id: user._id });

            expect(order).not.toBeNull();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('total_price', 100);
        });
    });

    describe('PUT /:id', () => {
        it('should return 400 if order is invalid', async () => {
            const user = new User({ username: 'testuser', email: 'test@test.com', password_hash: '12345' });
            await user.save();

            const order = new Order({ user_id: user._id, products: [], total_price: 100, order_date: new Date(), status: 'Pending' });
            await order.save();

            const res = await request(server)
                .put('/api/orders/' + order._id)
                .send({ status: 'Completed' });

            expect(res.status).toBe(400);
        });

        it('should return 404 if order is not found', async () => {
            const id = new mongoose.Types.ObjectId();

            const user = new User({ username: 'testuser', email: 'test@test.com', password_hash: '12345' });
            await user.save();

            const res = await request(server)
                .put('/api/orders/' + id)
                .send({ user_id: user._id, products: [], total_price: 100, order_date: new Date(), status: 'Delivered' });
            expect(res.status).toBe(404);
        });

        it('should update the order if it is valid', async () => {
            const user = new User({ username: 'testuser', email: 'test@test.com', password_hash: '12345' });
            await user.save();

            const order = new Order({ user_id: user._id, products: [], total_price: 100, order_date: new Date(), status: 'Pending' });
            await order.save();

            const res = await request(server)
                .put('/api/orders/' + order._id)
                .send({ user_id: order.user_id, products: [], total_price: 200, order_date: new Date(), status: 'Delivered' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('total_price', 200);
            expect(res.body).toHaveProperty('status', 'Delivered');
        });
    });

    describe('DELETE /:id', () => {
        it('should return 404 if order is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete('/api/orders/' + id);

            expect(res.status).toBe(404);
        });

        it('should delete the order if it is valid', async () => {
            const order = new Order({ user_id: new mongoose.Types.ObjectId(), products: [], total_price: 100, order_date: new Date(), status: 'Pending' });
            await order.save();

            const res = await request(server)
                .delete('/api/orders/' + order._id);

            expect(res.status).toBe(200);
            const deletedOrder = await Order.findById(order._id);
            expect(deletedOrder).toBeNull();
        });
    });
});
