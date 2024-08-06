const winston = require('winston');
const express = require('express');
const app = express();

// require('./startup/logging');
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
const logger = require('./startup/logging');
// require('./startup/validation')();
const error = require('./middleware/error');
app.use(error);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server; // Export the server instance
