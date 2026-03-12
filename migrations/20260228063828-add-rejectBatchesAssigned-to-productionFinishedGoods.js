'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "ProductionFinishedGoods",
      "rejectBatchesAssigned",
      {
        type: Sequelize.FLOAT
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "ProductionFinishedGoods",
      "rejectBatchesAssigned"
    );
  },
};
