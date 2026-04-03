'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('EInvoiceCredntials', 'gstin', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('EInvoiceCredntials', 'pin', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EInvoiceCredntials', 'gstin');
    await queryInterface.removeColumn('EInvoiceCredntials', 'pin');
  }
};
