const express = require('express');
// const genres = require('../routes/genres');
// const customers = require('../routes/customers');
// const movies = require('../routes/movies');
// const rentals = require('../routes/rentals');
const users = require('../routes/users');
const categories = require('../routes/categories');
const products = require('../routes/products');
const reviews = require('../routes/reviews');
const orders = require('../routes/orders');
const auth = require('../routes/auth');
const register = require('../routes/register');
// const error = require('../middleware/error');

module.exports = function (app) {
    app.use(express.json());
    // app.use('/api/genres', genres);
    // app.use('/api/customers', customers);
    // app.use('/api/movies', movies);
    // app.use('/api/rentals', rentals);
    app.use('/api/users', users);
    app.use('/api/categories', categories);
    app.use('/api/products', products);
    app.use('/api/reviews', reviews);
    app.use('/api/orders', orders);
    app.use('/api/auth', auth);
    app.use('/api/register', register);
    // app.use(error);
}