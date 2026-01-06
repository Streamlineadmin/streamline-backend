'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Items', ['companyId'], {
      name: 'idx_items_company_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Items', 'idx_items_company_id');
  },
};
