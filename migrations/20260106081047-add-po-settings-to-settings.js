'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Settings", "poMandatory", {
      type: Sequelize.BOOLEAN,
    });

    await queryInterface.addColumn("Settings", "poExactQuantity", {
      type: Sequelize.BOOLEAN,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Settings", "poMandatory");
    await queryInterface.removeColumn("Settings", "poExactQuantity");
  },
};
