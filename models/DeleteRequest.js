const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const delete_request = sequelize.define('deleteReequest', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },    
});

module.exports = delete_request;