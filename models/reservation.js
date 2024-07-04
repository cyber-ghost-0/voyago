const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const reservation = sequelize.define('reservation', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
    fname: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lname: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    adult: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    child: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false,
    }
});

module.exports = reservation;