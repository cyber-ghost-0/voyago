const Users = require('../models/users');
const jwt = require('jsonwebtoken');

let refreshTokens = []
module.exports.black_list = refreshTokens;

module.exports.isexist = async(name) => {
    let user = await Users.findOne({ where: { username: name } });
    // console.log(user);
    return user;
    
};

module.exports.getuser = async (name) => {
    let is_ex = await this.isexist(name);
    return is_ex;
};

module.exports.generateCod=()=> {
    // Generate a random number between 100000 (inclusive) and 999999 (inclusive)
    return Math.floor(Math.random() * 900000) + 100000;
}

module.exports.generateAccessToken = async(user) => {
    return await jwt.sign({ user: user }, '9e57eb4a64fdeb54c93f92202fb4b9f65e5d65c560f8c9000fc173c7a2843dea35fc3334252febf243654c22a696d3d39079ab2abfe70e239964eebc3a9948d9', { expiresIn: '40s' })
}