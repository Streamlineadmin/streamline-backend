'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('StockTransfers', 'itemId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Set to false if itemId is required
    });
    await queryInterface.addColumn('StockTransfers', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: true, // Set to false if quantity is required
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('StockTransfers', 'itemId');
    await queryInterface.removeColumn('StockTransfers', 'quantity');
  }
};
