const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Event = sequelize.define('Event', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    type: {
        type: Sequelize.STRING,
        allowNull: true
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    price: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },
    is_required: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    time: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true
    },
});

module.exports = Event;