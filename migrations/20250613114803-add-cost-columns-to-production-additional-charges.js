'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionAdditionalCharges', 'averageCost', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionAdditionalCharges', 'currentaverageCost', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionAdditionalCharges', 'totalCost', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('ProductionAdditionalCharges', 'currentCost', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionAdditionalCharges', 'averageCost');
    await queryInterface.removeColumn('ProductionAdditionalCharges', 'currentaverageCost');
    await queryInterface.removeColumn('ProductionAdditionalCharges', 'totalCost');
    await queryInterface.removeColumn('ProductionAdditionalCharges', 'currentCost');
  }
};
