'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("CustomFields", "unique", {
      type: Sequelize.BOOLEAN,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("CustomFields", "unique");
  },
};
