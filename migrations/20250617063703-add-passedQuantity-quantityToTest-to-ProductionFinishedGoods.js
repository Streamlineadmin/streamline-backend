'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionFinishedGoods', 'passedQuantity', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('ProductionFinishedGoods', 'quantityToTest', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionFinishedGoods', 'passedQuantity');
    await queryInterface.removeColumn('ProductionFinishedGoods', 'quantityToTest');
  }
};
