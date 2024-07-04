const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const charge_request = sequelize.define('chargeRequest', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
    amount: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    bank_ticket: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = charge_request;