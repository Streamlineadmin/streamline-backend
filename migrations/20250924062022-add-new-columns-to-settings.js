'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Settings', 'stockTransfer', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'stockUpdate', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'stockReconcilation', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'purchaseDocument', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'salesDocument', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'serviceDocument', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'production', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Settings', 'stockTransfer');
    await queryInterface.removeColumn('Settings', 'stockUpdate');
    await queryInterface.removeColumn('Settings', 'stockReconcilation');
    await queryInterface.removeColumn('Settings', 'purchaseDocument');
    await queryInterface.removeColumn('Settings', 'salesDocument');
    await queryInterface.removeColumn('Settings', 'serviceDocument');
    await queryInterface.removeColumn('Settings', 'production');
  }
};
