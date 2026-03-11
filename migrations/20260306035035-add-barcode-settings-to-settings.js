'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Settings", "itemInBarcodeSettings", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Settings", "itemOutBarcodeSettings", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Settings", "itemInBarcodeSettings");
    await queryInterface.removeColumn("Settings", "itemOutBarcodeSettings");
  },
};
