//const winston = require('winston');
const logger = require('../startup/logging');
module.exports = function (err, req, res, next) {
    //winston.error(err.message, err);
    logger.error(err.message, err);
    // error
    // warn
    // info
    // verbose
    // debug 
    // silly

    res.status(500).send('Internal Server Error.');
}