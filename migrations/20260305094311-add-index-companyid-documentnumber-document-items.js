'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(
      'Documents',
      ['companyId', 'documentNumber'],
      {
        name: 'idx_document_items_company_document_number',
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'Documents',
      'idx_document_items_company_document_number'
    );
  }
};
