const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const wallet = sequelize.define('wallet', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
    balance: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
});

module.exports = wallet;