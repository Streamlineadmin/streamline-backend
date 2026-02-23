'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove documentStatus column
    await queryInterface.removeColumn("InventoryApprovals", "documentStatus");

    // Change companyId from STRING to INTEGER
    await queryInterface.changeColumn("InventoryApprovals", "companyId", {
      type: Sequelize.INTEGER,
    });

    // Add approvedBy column
    await queryInterface.addColumn("InventoryApprovals", "approvedBy", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback changes
    await queryInterface.addColumn("InventoryApprovals", "documentStatus", {
      type: Sequelize.STRING,
    });

    await queryInterface.changeColumn("InventoryApprovals", "companyId", {
      type: Sequelize.STRING,
    });

    await queryInterface.removeColumn("InventoryApprovals", "approvedBy");
  },
};
