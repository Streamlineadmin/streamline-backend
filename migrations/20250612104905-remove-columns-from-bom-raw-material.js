'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BOMRawMaterials', 'issuedQuantity');
    await queryInterface.removeColumn('BOMRawMaterials', 'averagePrice');
    await queryInterface.removeColumn('BOMRawMaterials', 'consumedQuantity');
  },

  down: async (queryInterface, Sequelize) => {
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
  }
};
