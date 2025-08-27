'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    // Remove old columns
    await queryInterface.removeColumn('Settings', 'reduceStockOnIV');
    await queryInterface.removeColumn('Settings', 'reduceStockOnDC');

    // Add new columns
    await queryInterface.addColumn('Settings', 'stockReduceOnIV', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'stockReduceOnDC', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.removeColumn('Settings', 'stockReduceOnIV');
    await queryInterface.removeColumn('Settings', 'stockReduceOnDC');

    await queryInterface.addColumn('Settings', 'reduceStockOnIV', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'reduceStockOnDC', {
      type: Sequelize.STRING,
    });
  }
};
