const config = require('config');

module.exports = function () {
    if (!config.get('jwtPrivateKey')) {
        throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
    }

    if (!config.get('mail.user')) {
        throw new Error('FATAL ERROR: webst_mail_user is not defined.');
    }

    if (!config.get('mail.password')) {
        throw new Error('FATAL ERROR: webst_mail_password is not defined.');
    }
}