const Users = require('../models/User');
module.exports = (req, res, next) => {
    let name = req.body.username;
    Users.findOne({ where: { username: name } }).then(user => {
        if (user) {
            return res.status(401).json({ message: 'User has registered !' });
        }
        next();
    });
}