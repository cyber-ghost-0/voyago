const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const fav_users_Attrac = sequelize.define('fav_users_Attrac', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    tried: {
        type: Sequelize.BOOLEAN,
        unique: true
    }    
});

module.exports = fav_users_Attrac;