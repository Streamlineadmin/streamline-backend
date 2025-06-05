'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AccountDetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bankName: {
        type: Sequelize.STRING
      },
      accountHolderName: {
        type: Sequelize.STRING
      },
      accountNumber: {
        type: Sequelize.INTEGER
      },
      branch: {
        type: Sequelize.STRING
      },
      swiftCode: {
        type: Sequelize.STRING
      },
      IFSCCode: {
        type: Sequelize.STRING
      },
      MICRCode: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      companyId: {
        type: Sequelize.INTEGER
      },
      addedBy: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.INTEGER
      },
      ip_address: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AccountDetails');
  }
};