'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Documents', 'document_reference', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Documents', 'document_reference', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
};