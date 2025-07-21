'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ProductionSalesProcess', 'totalPlannedTime', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('ProductionSalesProcess', 'currentPlannedTime', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ProductionSalesProcess', 'totalPlannedTime', {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.changeColumn('ProductionSalesProcess', 'currentPlannedTime', {
      type: Sequelize.TIME,
      allowNull: true,
    });
  }
};
