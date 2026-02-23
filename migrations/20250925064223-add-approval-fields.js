'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // StoreItems
    await queryInterface.addColumn("StoreItems", "approvalId", {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn("StoreItems", "quantityForApproval", {
      type: Sequelize.FLOAT
    });

    // StockTransfer
    await queryInterface.addColumn("StockTransfers", "approvalId", {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn("StockTransfers", "quantityForApproval", {
      type: Sequelize.FLOAT
    });
  },

  async down(queryInterface, Sequelize) {
    // StoreItems
    await queryInterface.removeColumn("StoreItems", "approvalId");
    await queryInterface.removeColumn("StoreItems", "quantityForApproval");

    // StockTransfer
    await queryInterface.removeColumn("StockTransfers", "approvalId");
    await queryInterface.removeColumn("StockTransfers", "quantityForApproval");
  },
};
