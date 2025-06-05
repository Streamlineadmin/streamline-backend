'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Documents', 'quotation_reference', 'document_reference');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Documents', 'document_reference', 'quotation_reference');
  },
};