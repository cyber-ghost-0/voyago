const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const favourites = sequelize.define('favourites', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    is_favourite: {
        type: Sequelize.BOOLEAN,
    }    
});

module.exports = favourites;