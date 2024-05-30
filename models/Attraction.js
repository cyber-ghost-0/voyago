const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Attraction = sequelize.define('Attraction', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        unique: true
    },
    location: {
        type: Sequelize.GEOMETRY,
        allowNull: true
    },
    attraction_pic: {
        type: Sequelize.STRING,
        allowNull: true
    },
    description: {
        type:Sequelize.STRING
    }
    
});

module.exports = Attraction;