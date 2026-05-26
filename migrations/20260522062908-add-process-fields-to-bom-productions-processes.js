'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.addColumn('BOMProductionsProcesses', 'description', {
      type: Sequelize.TEXT,
    });

    await queryInterface.addColumn('BOMProductionsProcesses', 'plannedTime', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('BOMProductionsProcesses', 'cost', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BOMProductionsProcesses', 'description');
    await queryInterface.removeColumn('BOMProductionsProcesses', 'plannedTime');
    await queryInterface.removeColumn('BOMProductionsProcesses', 'cost');
  }
};
