'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BuyerSuppliers', 'customerType', {
      type: Sequelize.STRING,
      defaultValue: 'company'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BuyerSuppliers', 'customerType');
  }
};
