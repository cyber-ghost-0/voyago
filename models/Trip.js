const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const { FOREIGNKEYS } = require('sequelize/lib/query-types');
const { allow } = require('joi');
const Trip = sequelize.define('Trip', {
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
    description: {
        type: Sequelize.STRING,
        //allowMull: true
    },
    trip_price: {
        type: Sequelize.DOUBLE,
        //allowMull: false
    },
    end_date: {
        type: Sequelize.DATE,
        //allowMull: true
    },
    capacity: {
        type: Sequelize.INTEGER,
        //allowMull: false
    },
    avilable: {
        type: Sequelize.INTEGER,
        //allowMull: false
    },
    start_date: {
        type: Sequelize.DATE,
        //allowMull: true
    },
    guide: {
        type: Sequelize.STRING,
        //allowMull: false
    },
    meeting_point_name: {
        type: Sequelize.STRING,
        //allowMull: true
    },
    meeting_point_location: {
        type: Sequelize.STRING,
        //allowMull: true
    },
    TimeLimitCancellation: {
        type: Sequelize.INTEGER
    },
    available_capacity: {
        type: Sequelize.INTEGER
    }
});

module.exports = Trip;