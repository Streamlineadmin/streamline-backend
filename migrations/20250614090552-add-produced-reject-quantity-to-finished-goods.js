'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionFinishedGoods', 'producedQuantity', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionFinishedGoods', 'rejectQuantity', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionFinishedGoods', 'producedQuantity');
    await queryInterface.removeColumn('ProductionFinishedGoods', 'rejectQuantity');
  }
};
