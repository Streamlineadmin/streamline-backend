'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BuyerSupplierAddresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      buyerSupplierId: {
        type: Sequelize.INTEGER
      },
      addressLineOne: {
        type: Sequelize.STRING
      },
      addressLineTwo: {
        type: Sequelize.STRING
      },
      addressType: {
        type: Sequelize.INTEGER
      },
      city: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      country: {
        type: Sequelize.STRING
      },
      pincode: {
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
    await queryInterface.dropTable('BuyerSupplierAddresses');
  }
};