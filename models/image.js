const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const image = sequelize.define('image', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
    image: {
        type: Sequelize.STRING,
        allowNull: true
    },
    
});

module.exports = image;