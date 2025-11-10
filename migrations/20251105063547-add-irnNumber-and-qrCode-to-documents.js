'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'irnNumber', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Documents', 'qrCode', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'irnNumber');
    await queryInterface.removeColumn('Documents', 'qrCode');
  }
};
