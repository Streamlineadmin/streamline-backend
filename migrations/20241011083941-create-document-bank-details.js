'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DocumentBankDetails', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      documentNumber: {
        type: Sequelize.STRING
      },
      bankName: {
        type: Sequelize.STRING
      },
      accountName: {
        type: Sequelize.STRING
      },
      accountNumber: {
        type: Sequelize.STRING
      },
      branch: {
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
      SWIFTCode: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('DocumentBankDetails');
  }
};