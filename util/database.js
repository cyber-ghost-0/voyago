const Sequelize = require("sequelize");
const sequelize = new Sequelize("voyago", "root", "anas", {
  dialect: "mysql",
  host: "localhost",
  dialectModule: require('mysql2'), // Explicitly specify mysql2
});

module.exports = sequelize;
