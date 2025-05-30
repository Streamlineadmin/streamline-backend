'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('BatchItems', 'barcodenumbern', 'barCodeNumber');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('BatchItems', 'barCodeNumber', 'barcodenumbern');
  }
};
