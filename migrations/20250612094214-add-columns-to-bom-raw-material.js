'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BOMRawMaterials', 'issuedQuantity', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
    await queryInterface.addColumn('BOMRawMaterials', 'averagePrice', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
    await queryInterface.addColumn('BOMRawMaterials', 'consumedQuantity', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BOMRawMaterial', 'issuedQuantity');
    await queryInterface.removeColumn('BOMRawMaterial', 'averagePrice');
    await queryInterface.removeColumn('BOMRawMaterial', 'consumedQuantity');
  }
};
