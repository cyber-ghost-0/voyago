const Sequelize = require('sequelize');

const sequelize = require('../util/database');
const Users = sequelize.define('users', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING,
    unique:true
  },
  cod_ver: {
    type: Sequelize.INTEGER,
    allownull :true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique:true

  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role :{
    type: Sequelize.STRING,
    allowNull : false
  },
  location: {
    type: Sequelize.GEOMETRY,
    allowNull : true
  },
  profile_pic: {
    type: Sequelize.STRING,
    allowNull : true
  }
});

module.exports = Users;