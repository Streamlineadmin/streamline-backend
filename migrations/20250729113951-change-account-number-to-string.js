'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('AccountDetails', 'accountNumber', {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('AccountDetails', 'accountNumber', {
      type: Sequelize.INTEGER,
    });
  }
};
