const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Image = sequelize.define('Image', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
    url: {
        type: Sequelize.STRING,
        allowNull: true
    },
});

module.exports = Image;