const request = require('supertest');
const mongoose = require('mongoose');
const { Category } = require('../models/category');
const { Product } = require('../models/product');
let server;

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => next()));
jest.mock('../middleware/admin', () => jest.fn((req, res, next) => next()));
jest.mock('../startup/logging');

describe('/api/categories', () => {
    beforeEach(() => {
        server = require('../index');
    });

    afterEach(async () => {
        await server.close();
        await Category.deleteMany({});
        await Product.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all categories', async () => {
            await Category.collection.insertMany([
                { name: 'category1', description: 'description1' },
                { name: 'category2', description: 'description2' }
            ]);

            const res = await request(server).get('/api/categories');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(c => c.name === 'category1')).toBeTruthy();
            expect(res.body.some(c => c.name === 'category2')).toBeTruthy();
        });
    });

    describe('POST /', () => {
        it('should return 400 if category is invalid', async () => {
            const res = await request(server)
                .post('/api/categories')
                .send({ description: 'description' });

            expect(res.status).toBe(400);
        });

        it('should save the category if it is valid', async () => {
            const res = await request(server)
                .post('/api/categories')
                .send({ name: 'category1', description: 'description1' });

            const category = await Category.find({ name: 'category1' });

            expect(category).not.toBeNull();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'category1');
        });
    });

    describe('PUT /:id', () => {
        it('should return 400 if category is invalid', async () => {
            const category = new Category({ name: 'category1', description: 'description1' });
            await category.save();

            const res = await request(server)
                .put('/api/categories/' + category._id)
                .send({ description: 'description' });

            expect(res.status).toBe(400);
        });

        it('should return 404 if category is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .put('/api/categories/' + id)
                .send({ name: 'category1', description: 'description1' });

            expect(res.status).toBe(404);
        });

        it('should update the category if it is valid', async () => {
            const category = new Category({ name: 'category1', description: 'description1' });
            await category.save();

            const res = await request(server)
                .put('/api/categories/' + category._id)
                .send({ name: 'updatedName', description: 'updatedDescription' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'updatedName');
            expect(res.body).toHaveProperty('description', 'updatedDescription');
        });
    });

    describe('DELETE /:id', () => {
        it('should return 404 if category is not found', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete('/api/categories/' + id);

            expect(res.status).toBe(404);
        });

        it('should return 400 if category is associated with products', async () => {
            const category = new Category({ name: 'category1', description: 'description1' });
            await category.save();
            await Product.create({ name: 'product1', stock_quantity: 1, price: 10.15, description: 'demo product', category_id: category._id });

            const res = await request(server)
                .delete('/api/categories/' + category._id);

            expect(res.status).toBe(400);
        });

        it('should delete the category if it is valid', async () => {
            const category = new Category({ name: 'category1', description: 'description1' });
            await category.save();

            const res = await request(server)
                .delete('/api/categories/' + category._id);

            expect(res.status).toBe(200);
            const deletedCategory = await Category.findById(category._id);
            expect(deletedCategory).toBeNull();
        });
    });
});
