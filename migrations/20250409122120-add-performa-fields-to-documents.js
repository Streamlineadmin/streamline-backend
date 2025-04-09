'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Documents', 'performaInvoiceNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'performaInvoiceDate', {
      type: Sequelize.DATEONLY,
      allowNull: true, 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Documents', 'performaInvoiceNumber');
    await queryInterface.removeColumn('Documents', 'performaInvoiceDate');
  }
};