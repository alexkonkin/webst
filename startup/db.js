const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function () {
    mongoose.connect('mongodb://' + config.get('mongo.login') + ':' +
        config.get('mongo.password') + '@localhost:27017/' +
        config.get('mongo.db') + '?authSource=admin', {
        serverSelectionTimeoutMS: 30000, // Increase the timeout to 30 seconds
        socketTimeoutMS: 45000 // Increase the socket timeout to 45 seconds                        
    })
        .then(() => console.log('Connected to MongoDB...'))
        .catch(err => console.error('Could not connect to MongoDB...'));
}