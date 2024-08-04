const Sequelize = require("sequelize");
const sequelize = new Sequelize("voyago_000", "root", "", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
