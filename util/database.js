const Sequelize = require("sequelize");
const sequelize = new Sequelize("voyago", "root", "anas", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
