const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const { FOREIGNKEYS } = require('sequelize/lib/query-types');
const { allow } = require('joi');
const PersonalTrip = sequelize.define('PersonalTrip', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        //allowMull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        //allowMull: false
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    notes: {
        type: Sequelize.STRING,
        allowNull: true
    },
    duration: {
        type: Sequelize.INTEGER,
    },
});

module.exports = PersonalTrip;