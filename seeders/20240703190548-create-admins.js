'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashPassword = await bcrypt.hash('12345678', 12); // Replace 'adminpassword' with your desired password
    return queryInterface.bulkInsert('admins', [{
      username: 'Zaid Alshamaa',
      email: 'dsaae84@gmail.com',
      password: hashPassword,
      role: 'Super Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'Anas Allaham',
      email: 'anas.sahar.ahmad@gmail.com',
      password: hashPassword,
      role: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
      },
      {
        username: 'Aya Malla',
        email: 'aya@gmail.com',
        password: hashPassword,
        role: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('admins', { email: 'dsaae84@gmail.com' }, {});
  }
};
