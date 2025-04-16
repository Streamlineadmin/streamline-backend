'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'buyerGSTNumber', {
      type: Sequelize.STRING,
      allowNull: true, // set to false if it should be required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'buyerGSTNumber');
  }
};