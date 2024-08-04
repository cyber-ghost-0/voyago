const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const favourites = sequelize.define('FCM-tokens', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    token: {
        type: Sequelize.STRING,
    }    
});

module.exports = favourites;