'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'purpose', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Documents', 'requiredDate', {
      type: Sequelize.STRING
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'purpose');
    await queryInterface.removeColumn('Documents', 'requiredDate');
  }
};
