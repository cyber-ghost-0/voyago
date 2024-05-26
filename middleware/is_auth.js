const jwt = require('jsonwebtoken');
const blacklist = require('../services/public').black_list;

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token ) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    jwt.verify(token, '9e57eb4a64fdeb54c93f92202fb4b9f65e5d65c560f8c9000fc173c7a2843dea35fc3334252febf243654c22a696d3d39079ab2abfe70e239964eebc3a9948d9', (err, userID) => {
        console.log(userID);
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userID = userID.user;
        next();
    });
};