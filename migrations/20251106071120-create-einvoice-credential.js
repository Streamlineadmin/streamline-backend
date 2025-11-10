'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("EInvoiceCredntials", "user_name", "userName");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("EInvoiceCredntials", "userName", "user_name");
  }
};
