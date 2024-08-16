const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const AttractionForPersonal = sequelize.define('AttractionForPersonal', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
});

module.exports = AttractionForPersonal;