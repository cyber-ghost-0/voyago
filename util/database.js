const Sequelize = require('sequelize');
const sequelize = new Sequelize('voyago', 'anas', 'anas', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports =sequelize;


