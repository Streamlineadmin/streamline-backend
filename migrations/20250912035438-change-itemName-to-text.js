'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMFinishedGoods', 'itemName', {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn('BOMRawMaterials', 'itemName', {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn('BOMScrapMaterials', 'itemName', {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn('ProductionRawMaterials', 'itemName', {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn('ProductionFinishedGoods', 'itemName', {
      type: Sequelize.TEXT,
    });
    await queryInterface.changeColumn('ProductionScrapMaterials', 'itemName', {
      type: Sequelize.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMFinishedGoods', 'itemName', {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn('BOMRawMaterials', 'itemName', {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn('BOMScrapMaterials', 'itemName', {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn('ProductionRawMaterials', 'itemName', {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn('ProductionFinishedGoods', 'itemName', {
      type: Sequelize.STRING,
    });
    await queryInterface.changeColumn('ProductionScrapMaterials', 'itemName', {
      type: Sequelize.STRING,
    });
  }
};
