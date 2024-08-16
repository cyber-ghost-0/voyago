const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const PersonalDay = sequelize.define('PersonalDay', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    num: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});

module.exports = PersonalDay;