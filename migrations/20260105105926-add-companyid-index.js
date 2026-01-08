'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Documents', ['companyId'], {
      name: 'idx_documents_company_id',
    });

    await queryInterface.addIndex('DocumentItems', ['companyId'], {
      name: 'idx_document_items_company_id',
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'Documents',
      'idx_documents_company_id'
    );

    await queryInterface.removeIndex(
      'DocumentItems',
      'idx_document_items_company_id'
    );
  },
};
