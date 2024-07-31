const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const every_user_review = sequelize.define('everyReservationEvent', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    adult: {
        type: Sequelize.INTEGER
        ,allowNull:true
    },
    child: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});

module.exports = every_user_review;