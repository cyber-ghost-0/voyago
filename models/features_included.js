const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const features_included = sequelize.define('features_included', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    type: {
        type:Sequelize.STRING
    }
});

module.exports = features_included;