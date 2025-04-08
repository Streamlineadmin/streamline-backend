'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Documents', 'buyerBillingAddress', {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'buyerDeliveryAddress', {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'supplierBillingAddress', {
      type: Sequelize.JSON,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'supplierDeliverAddress', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Documents', 'buyerBillingAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'buyerDeliveryAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'supplierBillingAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('Documents', 'supplierDeliverAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};