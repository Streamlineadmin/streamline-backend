'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("BOMApprovals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      approvalId: {
        type: Sequelize.STRING,
      },
      bomId: {
        type: Sequelize.STRING,
      },
      bomDetailId: {
        type: Sequelize.INTEGER,
      },
      bomName: {
        type: Sequelize.STRING,
      },
      approvalStatus: {
        type: Sequelize.STRING,
        defaultValue: 'Pending',
      },
      requestedBy: {
        type: Sequelize.INTEGER,
      },
      companyId: {
        type: Sequelize.INTEGER,
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      approvalDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("BOMApprovals");
  },
};
