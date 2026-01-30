'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Stores", "default", {
      type: Sequelize.BOOLEAN,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Stores", "default");
  }
};
