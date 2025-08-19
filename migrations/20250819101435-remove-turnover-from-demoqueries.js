'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DemoQueries", "turnover");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("DemoQueries", "turnover", {
      type: Sequelize.STRING,
      allowNull: true, // adjust if you want it NOT NULL originally
    });
  },
};
