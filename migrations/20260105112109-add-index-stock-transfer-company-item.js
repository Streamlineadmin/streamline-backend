'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addIndex(
      'StockTransfers',
      ['companyId'],
      {
        name: 'idx_stock_transfer_company_id',
      }
    );

    await queryInterface.addIndex(
      'StockTransfers',
      ['itemId'],
      {
        name: 'idx_stock_transfer_item_id',
      }
    );
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex(
      'StockTransfers',
      'idx_stock_transfer_company_id'
    );

    await queryInterface.removeIndex(
      'StockTransfers',
      'idx_stock_transfer_item_id'
    );
  },
};
