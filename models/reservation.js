const Sequelize = require("sequelize");

const sequelize = require("../util/database");
const reservation = sequelize.define("reservation", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  adult: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  child: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email :{
    type: Sequelize.STRING,
    allowNull: false,
  }
});

module.exports = reservation;
