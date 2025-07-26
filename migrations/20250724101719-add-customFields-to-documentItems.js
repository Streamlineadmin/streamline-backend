'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DocumentItems', 'customFields', {
      type: Sequelize.JSON,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('DocumentItems', 'customFields');
  }
};
