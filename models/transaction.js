const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const transaction = sequelize.define('transaction', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    new_balance: {
        type: Sequelize.INTEGER,
        allowNull: true,

    }, last_balance: {
        type: Sequelize.INTEGER,
        allowNull: true,

    }, status: {
        type: Sequelize.STRING,
        allowNull: true,

    }, type: {
        type: Sequelize.STRING,
        allowNull: true
    }
        
});

module.exports = transaction;