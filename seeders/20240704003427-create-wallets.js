'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('wallets', [{
      balance: 0,
      UserId:1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      balance: 0,
      UserId:2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      balance: 0,
      UserId:3,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('wallets', { balance: 0 }, {});
  }
};
