'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StockTransfers', 'documentNumber', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StockTransfers', 'documentNumber');
  }
};
