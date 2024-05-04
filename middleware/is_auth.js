const jwt = require('jsonwebtoken');
const blacklist = require('../services/public').black_list;

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // console.log('=>',req.session.token,'<=');
    const token = authHeader && authHeader.split(' ')[1];
    // console.log(blacklist.has(token), " ", token);
    if (!token ) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // console.log('///',token,'////');
    jwt.verify(token, 'L93KjbNwTdR4yvSgEcP6XfM2D7zR8hWq', (err, userID) => {
        console.log(userID);
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = userID;
        next();
    });
};