'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DemoQueries", "turnover", {
      type: Sequelize.STRING,
      allowNull: true, // change to false if required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DemoQueries", "turnover");
  },
};
