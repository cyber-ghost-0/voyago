require('dotenv').config();
const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  dialect: "mysql",
  host: process.env.DB_HOST,
  dialectModule: require('mysql2'), // Explicitly specify mysql2
});

module.exports = sequelize;
