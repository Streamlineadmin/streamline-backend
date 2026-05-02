'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Documents", "ackNumber", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "ackDate", {
      type: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Documents", "ackNumber");
    await queryInterface.removeColumn("Documents", "ackDate");
  },
};
