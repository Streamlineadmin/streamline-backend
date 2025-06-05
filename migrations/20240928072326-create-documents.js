'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Documents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      documentType: {
        type: Sequelize.STRING
      },
      documentNumber: {
        type: Sequelize.STRING
      },
      buyerName: {
        type: Sequelize.STRING
      },
      buyerBillingAddress: {
        type: Sequelize.STRING
      },
      buyerDeliveryAddress: {
        type: Sequelize.STRING
      },
      buyerContactNumber: {
        type: Sequelize.STRING
      },
      buyerEmail: {
        type: Sequelize.STRING
      },
      supplierName: {
        type: Sequelize.STRING
      },
      supplierBillingAddress: {
        type: Sequelize.STRING
      },
      supplierDeliverAddress: {
        type: Sequelize.STRING
      },
      supplierContactNo: {
        type: Sequelize.STRING
      },
      supplierEmail: {
        type: Sequelize.STRING
      },
      documentDate: {
        type: Sequelize.STRING
      },
      ammendment: {
        type: Sequelize.STRING
      },
      deliveryDate: {
        type: Sequelize.STRING
      },
      paymentTerm: {
        type: Sequelize.STRING
      },
      store: {
        type: Sequelize.STRING
      },
      enquiryNumber: {
        type: Sequelize.STRING
      },
      enquiryDate: {
        type: Sequelize.STRING
      },
      logisticDetails: {
        type: Sequelize.TEXT
      },
      additionalDetails: {
        type: Sequelize.TEXT
      },
      signature: {
        type: Sequelize.STRING
      },
      companyId: {
        type: Sequelize.INTEGER
      },
      createdBy: {
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
    await queryInterface.dropTable('Documents');
  }
};