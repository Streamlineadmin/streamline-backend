'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("InventoryApprovals", "batchesAssigned", {
      type: Sequelize.BOOLEAN,
    });

    await queryInterface.addColumn("ProductionFinishedGoods", "batchesAssigned", {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("InventoryApprovals", "batchesAssigned");
    await queryInterface.removeColumn("ProductionFinishedGoods", "batchesAssigned");
  },
};
