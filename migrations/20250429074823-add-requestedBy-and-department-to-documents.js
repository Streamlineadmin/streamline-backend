'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'requestedBy', {
      type: Sequelize.STRING, 
    });
    await queryInterface.addColumn('Documents', 'department', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'requestedBy');
    await queryInterface.removeColumn('Documents', 'department');
  }
};
