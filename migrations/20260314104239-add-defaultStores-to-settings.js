'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Settings", "defaultStores", {
      type: Sequelize.JSON,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Settings", "defaultStores");
  },
};
