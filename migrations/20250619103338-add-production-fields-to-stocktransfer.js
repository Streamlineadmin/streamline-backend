'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StockTransfers', 'productionId', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('StockTransfers', 'productionNavigationId', {
      type: Sequelize.INTEGER
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StockTransfers', 'productionId');
    await queryInterface.removeColumn('StockTransfers', 'productionNavigationId');
  }
};
