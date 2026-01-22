'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Settings", "printFontSize", {
      type: Sequelize.INTEGER,
      defaultValue: 10,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Settings", "printFontSize");
  },
};
