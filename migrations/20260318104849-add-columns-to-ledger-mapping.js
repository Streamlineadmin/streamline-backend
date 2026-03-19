'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('LedgerMappings', 'companyId', {
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('LedgerMappings', 'status', {
      type: Sequelize.INTEGER,
    });

    await queryInterface.addColumn('LedgerMappings', 'userId', {
      type: Sequelize.INTEGER,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('LedgerMappings', 'companyId');
    await queryInterface.removeColumn('LedgerMappings', 'status');
    await queryInterface.removeColumn('LedgerMappings', 'userId');
  }
};
