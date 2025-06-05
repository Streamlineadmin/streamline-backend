'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StockTransfers', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false, 
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StockTransfers', 'price');
  }
};
