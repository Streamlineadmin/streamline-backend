'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('EMailCredentials', 'gstin', {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn('EMailCredentials', 'pin', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('EMailCredentials', 'gstin');
    await queryInterface.removeColumn('EMailCredentials', 'pin');
  }
};
