'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(
      'StoreItems',
      ['storeId'],
      {
        name: 'idx_store_items_store_id',
      }
    );

    await queryInterface.addIndex(
      'StoreItems',
      ['itemId'],
      {
        name: 'idx_store_items_item_id',
      }
    );
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex(
      'StoreItems',
      'idx_store_items_store_id'
    );

    await queryInterface.removeIndex(
      'StoreItems',
      'idx_store_items_item_id'
    );
  },
};
