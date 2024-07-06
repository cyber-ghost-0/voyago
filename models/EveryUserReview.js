const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const every_user_review = sequelize.define('EveryUserReview', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    comment: {
        type: Sequelize.STRING
        ,allowNull:true
    },
    rate: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});

module.exports = every_user_review;