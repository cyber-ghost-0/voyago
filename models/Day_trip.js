const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const DAY = sequelize.define('Day_Trip', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    num: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});

module.exports = DAY;