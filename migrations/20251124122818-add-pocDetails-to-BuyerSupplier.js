'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn('BuyerSuppliers', 'pocDetails', {
      type: Sequelize.JSON,
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('BuyerSuppliers', 'pocDetails');
  }
};
