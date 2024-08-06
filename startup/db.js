const logger = require('../startup/logging');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function () {
    const dbConnectionString = 'mongodb://' + config.get('mongo.login') + ':' +
        config.get('mongo.password') + '@127.0.0.1:27017/' +
        config.get('mongo.db') + '?authSource=admin';

    logger.info('Attempting to connect to MongoDB...', { connectionString: dbConnectionString });

    mongoose.connect(dbConnectionString, {
        serverSelectionTimeoutMS: 30000, // Increase the timeout to 30 seconds
        socketTimeoutMS: 45000 // Increase the socket timeout to 45 seconds                        
    })
        .then(() => {
            logger.info('Connected to MongoDB...');
        })
        .catch(err => {
            logger.error('Could not connect to MongoDB...', { error: err.message });
        });
}
