const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const every_feature = sequelize.define('every_feature', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }
});

module.exports = every_feature;