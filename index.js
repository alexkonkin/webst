const winston = require('winston');
const express = require('express');
const app = express();

// require('./startup/logging');
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/config')();
// require('./startup/validation')();
//const logger = require('./startup/logging');
const error = require('./middleware/error');
app.use(error);

const port = process.env.PORT || 3000;
app.listen(port, () => winston.info(`Listening on port ${port}...`));