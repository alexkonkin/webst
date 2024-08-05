const request = require('supertest');
const mongoose = require('mongoose');
const { Product } = require('../models/product');
const { Review } = require('../models/review');
const { Order } = require('../models/order');
const { Category } = require('../models/category');
let server;

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));
jest.mock('../startup/logging');

describe('/api/products', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        await server.close();
        await Product.deleteMany({});
        await Review.deleteMany({});
        await Order.deleteMany({});
        await Category.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all products', async () => {
            await Product.collection.insertMany([
                { name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 },
                { name: 'product2', description: 'description2', price: 20, category_id: new mongoose.Types.ObjectId(), stock_quantity: 200 }
            ]);

            const res = await request(server).get('/api/products');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(p => p.name === 'product1')).toBeTruthy();
            expect(res.body.some(p => p.name === 'product2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return a product if a valid ID is passed', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();

            const res = await request(server).get('/api/products/' + product._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', product.name);
        });

        it('should return 404 if an invalid ID is passed', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/products/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', () => {
        it('should return 400 if product is invalid', async () => {
            const res = await request(server)
                .post('/api/products')
                .send({ description: 'description' });

            expect(res.status).toBe(400);
        });

        it('should save the product if it is valid', async () => {
            const category = new Category({ name: 'category1', description: 'description1' });
            await category.save();

            const productData = { name: 'product1', description: 'some product description1', pictures: ['http://localhost/picture1.jpg'], price: 10, category_id: category._id, stock_quantity: 100 };

            const res = await request(server)
                .post('/api/products')
                .send(productData);

            const product = await Product.find({ name: 'product1' });

            expect(product).not.toBeNull();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'product1');
        });
    });

    describe('PUT /:id', () => {
        it('should return 400 if product is invalid', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();

            const res = await request(server)
                .put('/api/products/' + product._id)
                .send({ description: 'description' });

            expect(res.status).toBe(400);
        });

        it('should return 404 if product is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .put('/api/products/' + id)
                .send({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });

            expect(res.status).toBe(404);
        });

        it('should update the product if it is valid', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();

            const res = await request(server)
                .put('/api/products/' + product._id)
                .send({ name: 'updatedName', description: 'updatedDescription', price: 20, category_id: product.category_id, stock_quantity: 200 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'updatedName');
            expect(res.body).toHaveProperty('description', 'updatedDescription');
            expect(res.body).toHaveProperty('price', 20);
            expect(res.body).toHaveProperty('stock_quantity', 200);
        });
    });

    describe('DELETE /:id', () => {
        it('should return 404 if product is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete('/api/products/' + id);

            expect(res.status).toBe(404);
        });

        it('should return 400 if product is associated with reviews or orders', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();
            await Review.create({ product_id: product._id, user_id: new mongoose.Types.ObjectId(), rating: 5, comment: 'Great product' });
            await Order.create({ user_id: new mongoose.Types.ObjectId(), products: [{ product_id: product._id, quantity: 1, price: 100 }], total_price: 10, order_date: new Date(), status: 'Pending' });

            const res = await request(server)
                .delete('/api/products/' + product._id);

            expect(res.status).toBe(400);
        });

        it('should delete the product if it is valid', async () => {
            const product = new Product({ name: 'product1', description: 'description1', price: 10, category_id: new mongoose.Types.ObjectId(), stock_quantity: 100 });
            await product.save();

            const res = await request(server)
                .delete('/api/products/' + product._id);

            expect(res.status).toBe(200);
            const deletedProduct = await Product.findById(product._id);
            expect(deletedProduct).toBeNull();
        });
    });
});
