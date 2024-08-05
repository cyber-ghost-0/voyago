const Sequelize = require("sequelize");

const sequelize = require("../util/database");
const Notification = sequelize.define("Notifications", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  body: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  type: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ID_Type: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

module.exports = Notification;
