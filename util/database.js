const Sequelize = require('sequelize');
const sequelize = new Sequelize('product', 'anas', 'anas', {
  dialect: 'mysql',
  host: 'localhost'
});


module.exports =sequelize;


