const mongoose = require('mongoose');
const config = require('config');

beforeAll(async () => {
    const db = config.get('mongo.db');
    const user = config.get('mongo.login');
    const password = config.get('mongo.password');
    const uri = `mongodb://${user}:${password}@127.0.0.1:27017/${db}?authSource=admin`;

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000, // Increase the timeout to 30 seconds
        socketTimeoutMS: 4500 // Increase the socket timeout to 45 seconds                        
    });
});

afterAll(async () => {
    await mongoose.disconnect();
});
