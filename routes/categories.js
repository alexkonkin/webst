const { Category, validate } = require('../models/category');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// GET route to retrieve all categories, sorted by name
router.get('/', async (req, res) => {
    try {
        // Fetch all categories from the database and sort them by name
        const categories = await Category.find().sort('name');

        // Send the retrieved categories as the response
        res.send(categories);
    } catch (error) {
        // Handle any errors that occur during the database query
        res.status(500).send('Internal Server Error: ' + error);
    }
});

// POST route to create a new category
router.post('/', async (req, res) => {
    try {
        // Validate the request body
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        // Destructure the request body
        const { name, description } = req.body;

        // Create a new category
        let category = new Category({
            name,
            description
        });

        // Save the category to the database
        category = await category.save();

        // Send the created category as the response
        res.send(category);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error creating category:', error);
        res.status(500).send('Internal Server Error: ' + error);
    }
});

router.put('/:id', async (req, res) => {
    try {
        // Validate the request body
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        // Destructure the request body
        const { name, description } = req.body;

        // Find and update the category by ID
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true }
        );

        // If the category is not found, return a 404 error
        if (!category) return res.status(404).send('The category with the given ID was not found.');

        // Send the updated category as the response
        res.send(category);
    } catch (err) {
        // Handle any errors that occur during the process
        console.error('Error updating category:', err);
        res.status(500).send('Internal Server Error: ' + err);
    }
});

// router.delete('/:id', async (req, res) => {
//     const movie = await Movie.findByIdAndRemove(req.params.id);

//     if (!movie) return res.status(404).send('The movie with the given ID was not found.');

//     res.send(movie);
// });

// router.get('/:id', async (req, res) => {
//     const movie = await Movie.findById(req.params.id);

//     if (!movie) return res.status(404).send('The movie with the given ID was not found.');

//     res.send(movie);
// });

module.exports = router; 