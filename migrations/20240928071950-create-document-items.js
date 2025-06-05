'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DocumentItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      documentNumber: {
        type: Sequelize.STRING
      },
      itemId: {
        type: Sequelize.STRING
      },
      itemName: {
        type: Sequelize.STRING
      },
      HSN: {
        type: Sequelize.STRING
      },
      UOM: {
        type: Sequelize.STRING
      },
      quantity: {
        type: Sequelize.INTEGER
      },
      price: {
        type: Sequelize.INTEGER
      },
      discountOne: {
        type: Sequelize.STRING
      },
      discountTwo: {
        type: Sequelize.STRING
      },
      totalDiscount: {
        type: Sequelize.STRING
      },
      taxType: {
        type: Sequelize.STRING
      },
      tax: {
        type: Sequelize.STRING
      },
      totalTax: {
        type: Sequelize.STRING
      },
      totalBeforeTax: {
        type: Sequelize.STRING
      },
      totalAfterTax: {
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
    await queryInterface.dropTable('DocumentItems');
  }
};