require('dotenv').config();
const Sequelize = require("sequelize");
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  dialect: "mysql",
  host: process.env.DB_HOST,
  port:process.env.DB_PORT,
  dialectModule: require('mysql2'),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,  // increase the acquire timeout
    idle: 10000      // increase the idle timeout
  },
  dialectOptions: {
    connectTimeout: 60000 // 60 seconds
  }
});

module.exports = sequelize;
