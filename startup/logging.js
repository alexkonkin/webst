const winston = require('winston');
//require('winston-mongodb');
require('express-async-errors');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logfile.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'uncaughtExceptions.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

module.exports = logger;

