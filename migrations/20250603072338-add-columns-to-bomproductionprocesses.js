"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn("BOMProductionsProcesses", "processName", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("BOMProductionsProcesses", "userId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.addColumn("BOMProductionsProcesses", "companyId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn("BOMProductionsProcesses", "processName"),
      queryInterface.removeColumn("BOMProductionsProcesses", "userId"),
      queryInterface.removeColumn("BOMProductionsProcesses", "companyId"),
    ]);
  },
};
