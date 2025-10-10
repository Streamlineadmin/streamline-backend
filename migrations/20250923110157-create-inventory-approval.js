'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("InventoryApprovals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      approvalId: {
        type: Sequelize.STRING,
      },
      documentType: {
        type: Sequelize.STRING,
      },
      documentNumber: {
        type: Sequelize.STRING,
      },
      documentStatus: {
        type: Sequelize.STRING,
      },
      approvalStatus: {
        type: Sequelize.STRING,
      },
      requestedBy: {
        type: Sequelize.INTEGER,
      },
      companyId: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("InventoryApprovals");
  },
};
