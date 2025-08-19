'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('DocumentItems', 'price', {
      type: Sequelize.FLOAT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('DocumentItems', 'price', {
      type: Sequelize.INTEGER,
    });
  }
};
