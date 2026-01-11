'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("EMailCredentials", "userId", {
      type: Sequelize.INTEGER
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("EMailCredentials", "userId");
  },
};
