'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('destenations', [{
      name: 'Damascus',
      location: 'Syria',
      description: 'let me shutting up my mouth',
      createdAt: new Date(),
      updatedAt: new Date(),
      AdminId:1

    },
    {
        name: 'palastine',
        location: 'Gaza',
        description: 'Most honorly place',
        createdAt: new Date(),
        updatedAt: new Date(),
        AdminId:1

      },
      {
        name: 'Paris',
        location: 'France',
        description: 'Most dairty place',
        createdAt: new Date(),
        updatedAt: new Date(),
        AdminId:2

      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('destenations', { name: 'dsaae84@gmail.com' }, {});
  }
};
