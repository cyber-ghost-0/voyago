const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const PersonalEvent = sequelize.define('PersonalEvent', {
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
    duration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
});

module.exports = PersonalEvent;