'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ProductionFinishedGoods", "pendingReworkQuantity", {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn("ProductionFinishedGoods", "completedReworkQuantity", {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn("ProductionFinishedGoods", "reworkQuantityCost", {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ProductionFinishedGoods", "pendingReworkQuantity");
    await queryInterface.removeColumn("ProductionFinishedGoods", "completedReworkQuantity");
    await queryInterface.removeColumn("ProductionFinishedGoods", "reworkQuantityCost");
  },
};
