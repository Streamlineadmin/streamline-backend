'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'GSTValue', {
      type: Sequelize.STRING,
      allowNull: true, // Set to false if you want to make it required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'GSTValue');
  }
};