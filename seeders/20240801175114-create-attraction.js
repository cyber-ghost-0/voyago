'use strict';
const bcrypt = require('bcrypt');
const Destenation = require('../models/Destenation');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('attractions', [{
      name: 'Omayad Mosque',
      location: 'Souq-Al-Hamedeyah',
      description: 'Fantaaastic',
      createdAt: new Date(),
      updatedAt: new Date(),
      AdminId:2,
      DestenationId:1
    },
    {
        name: 'Al_Aqsa',
        location: 'Near by Qubat-Al-Sakhra',
        description: 'Wonderful',
        createdAt: new Date(),
        updatedAt: new Date(),
        AdminId:3,
        DestenationId:2
      },
      {
        name: 'Evil',
        location: 'IDK',
        description: 'Taller than me <3',
        createdAt: new Date(),
        updatedAt: new Date(),
        AdminId:3,
        DestenationId:3

      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('attractions', { name: 'dsaae84@gmail.com' }, {});
  }
};
