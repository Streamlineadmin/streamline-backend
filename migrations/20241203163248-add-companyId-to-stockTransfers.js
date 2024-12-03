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
    await queryInterface.addColumn('StockTransfers', 'companyId', {
      type: Sequelize.INTEGER,
      allowNull: false, // Adjust based on your requirements
      defaultValue: 1, // Optional: Set a default value
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('StockTransfers', 'companyId');
  }
};
