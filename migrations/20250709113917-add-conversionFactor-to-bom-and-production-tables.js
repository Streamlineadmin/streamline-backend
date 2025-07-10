'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('BOMRawMaterials', 'conversionFactor', {
        type: Sequelize.FLOAT,
      }),
      queryInterface.addColumn('ProductionScrapMaterials', 'conversionFactor', {
        type: Sequelize.FLOAT,
      }),
      queryInterface.addColumn('ProductionRawMaterials', 'conversionFactor', {
        type: Sequelize.FLOAT,
      }),
      queryInterface.addColumn('ProductionFinishedGoods', 'conversionFactor', {
        type: Sequelize.FLOAT,
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('BOMRawMaterials', 'conversionFactor'),
      queryInterface.removeColumn('ProductionScrapMaterials', 'conversionFactor'),
      queryInterface.removeColumn('ProductionRawMaterials', 'conversionFactor'),
      queryInterface.removeColumn('ProductionFinishedGoods', 'conversionFactor')
    ]);
  }
};
