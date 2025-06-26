'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LogPayments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyName: {
        type: Sequelize.STRING
      },
      companyId: {
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      documentType: {
        type: Sequelize.STRING
      },
      documentNumber: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.STRING
      },
      updatedAt: {
        type: Sequelize.STRING
      },
      dueDate: {
        type: Sequelize.STRING
      },
      amountPaid: {
        type: Sequelize.FLOAT
      },
      logPayment: {
        type: Sequelize.FLOAT
      },
      comments: {
        type: Sequelize.STRING
      },
      markPaid: {
        type: Sequelize.BOOLEAN
      },
      paymentDate: {
        type: Sequelize.STRING
      },
      paymentMode: {
        type: Sequelize.STRING
      },
      bankName: {
        type: Sequelize.STRING
      },
      transactionNumber: {
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
    await queryInterface.dropTable('LogPayments');
  }
};