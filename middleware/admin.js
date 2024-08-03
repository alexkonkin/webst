const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        decoded.isAdmin == true

        if (decoded.isAdmin !== true) {
            throw new Error('Access denied. Admin privileges required.');
        }

        next();
    }
    catch (ex) {
        if (ex.message === 'Access denied. Admin privileges required.') {
            res.status(403).send(ex.message);
        } else {
            res.status(400).send('Invalid token.');
        }
    }
}