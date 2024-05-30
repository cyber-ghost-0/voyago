const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Trips_review = sequelize.define('Trips_review', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    rate: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    comment: {
        type: Sequelize.STRING,
        allowNull: true
    },
        
});

module.exports = Trips_review;