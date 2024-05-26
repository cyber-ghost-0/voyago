const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const { FOREIGNKEYS } = require('sequelize/lib/query-types');
const Trip = sequelize.define('Trip', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    location: {
        type: Sequelize.GEOMETRY,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    trip_price: {
        type: Sequelize.DOUBLE,
        allowNull: false
    },
    end_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    avilable: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    guide: {
        type: Sequelize.STRING,
        allowNull: false
    },
    meeting_point_name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    meeting_point_location: {
        type: Sequelize.GEOMETRY,
        allowNull: true
    },
    feature_included: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = Trip;