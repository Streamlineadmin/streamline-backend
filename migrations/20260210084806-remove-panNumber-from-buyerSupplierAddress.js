'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "BuyerSupplierAddresses",
      "panNumber"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "BuyerSupplierAddresses",
      "panNumber",
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
  },
};
