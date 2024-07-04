'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashPassword = await bcrypt.hash('12345678', 12); // Replace 'adminpassword' with your desired password
    return queryInterface.bulkInsert('users', [{
      username: 'Aya sareej',
      email: 'dsaae84@gmail.com',
      password: hashPassword,
      role: 'user',
      cod_ver:'12345',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'alaa dal30o',
      email: 'anas.sahar.ahmad@gmail.com',
      password: hashPassword,
      role: 'user',
      cod_ver:'12345',
      createdAt: new Date(),
      updatedAt: new Date()
      },
      {
        username: 'Aya Baqlah',
        email: 'aya@gmail.com',
        password: hashPassword,
        role: 'user',
        cod_ver:'12345',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', { email: 'dsaae84@gmail.com' }, {});
  }
};
