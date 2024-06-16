const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Event = sequelize.define('Event', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    action: {
        type: Sequelize.STRING,
        allowNull: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true
    },
    start_date: {
        type: Sequelize.STRING,
        allowNull: true
    },
    duration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    type: {
        type: Sequelize.STRING,
        allowNull: true
    },
    price_adult: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    price_child: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    additional_note: {
        type: Sequelize.STRING,
        allowNull: true
    },
});

module.exports = Event;