'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionSalesProcess', 'averageCost', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionSalesProcess', 'currentaverageCost', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionSalesProcess', 'totalPlannedTime', {
      type: Sequelize.TIME,
    });

    await queryInterface.addColumn('ProductionSalesProcess', 'currentPlannedTime', {
      type: Sequelize.TIME,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionSalesProcess', 'averageCost');
    await queryInterface.removeColumn('ProductionSalesProcess', 'currentaverageCost');
    await queryInterface.removeColumn('ProductionSalesProcess', 'totalPlannedTime');
    await queryInterface.removeColumn('ProductionSalesProcess', 'currentPlannedTime');
  }
};
