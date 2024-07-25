const { Product, validate } = require('../models/product');
const express = require('express');
const router = express.Router();

// GET route to retrieve all products, sorted by name
router.get('/', async (req, res) => {
    try {
        // Fetch all products from the database and sort them by name
        const products = await Product.find().sort('name');

        // Send the retrieved products as the response
        res.send(products);
    } catch (error) {
        // Handle any errors that occur during the database query
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// POST route to create a new Product
router.post('/', async (req, res) => {
    try {
        // Validate the request body
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        // Destructure the request body
        const { name, description, price, pictures, category_id, stock_quantity } = req.body;

        // Create a new Product
        let product = new Product({
            name,
            description,
            price,
            pictures,
            category_id,
            stock_quantity
        });

        // Save the Product to the database
        product = await product.save();

        // Send the created Product as the response
        res.send(product);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error creating Product:', error.message);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// PUT route to update a Product by ID
router.put('/:id', async (req, res) => {
    try {
        // Validate the request body
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        // Destructure the request body
        const { name, description, price, pictures, category_id, stock_quantity } = req.body;

        // Find and update the Product by ID
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { name, description, price, pictures, category_id, stock_quantity },
            { new: true }
        );

        // If the Product is not found, return a 404 error
        if (!product) return res.status(404).send('The Product with the given ID was not found.');

        // Send the updated Product as the response
        res.send(product);
    } catch (err) {
        // Handle any errors that occur during the process
        console.error('Error updating Product:', err.message);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

// DELETE route to remove a Product by ID
router.delete('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const reviewCount = await Review.countDocuments({ product_id: req.params.id }).session(session);
        const orderCount = await Order.countDocuments({ product_id: req.params.id }).session(session);

        if (reviewCount > 0 /*|| orderCount > 0*/) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).send('Cannot delete the product as it is associated with existing reviews or orders.');
        }

        const product = await Product.findByIdAndDelete(req.params.id).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send('The product with the given ID was not found.');
        }

        await session.commitTransaction();
        session.endSession();
        res.send(product);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting product:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// GET route to retrieve a Product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        // If the Product is not found, return a 404 error
        if (!product) return res.status(404).send('The Product with the given ID was not found.');

        // Send the retrieved Product as the response
        res.send(product);
    } catch (err) {
        // Handle any errors that occur during the process
        console.error('Error retrieving Product:', err.message);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

module.exports = router;
