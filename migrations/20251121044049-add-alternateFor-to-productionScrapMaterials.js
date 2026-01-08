'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionScrapMaterials', 'alternateFor', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionScrapMaterials', 'alternateFor');
  }
};
