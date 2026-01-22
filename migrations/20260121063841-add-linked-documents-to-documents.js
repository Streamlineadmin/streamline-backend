'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Documents', 'linkedDocuments', {
      type: Sequelize.JSON
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Documents', 'linkedDocuments');
  }
};
