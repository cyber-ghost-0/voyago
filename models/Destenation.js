const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Destenation = sequelize.define('Destenation', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    unique:true
  },
  location: {
    type: Sequelize.GEOMETRY,
    allowNull : true
  },
  
});

module.exports = Destenation;