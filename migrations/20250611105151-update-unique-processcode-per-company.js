'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the old unique index on processCode
    await queryInterface.removeIndex('ProductionProcess', 'processCode');

    // Add new composite unique index on (processCode, companyId)
    await queryInterface.addIndex('ProductionProcess', ['processCode', 'companyId'], {
      unique: true,
      name: 'unique_processcode_per_company'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert: Remove composite index
    await queryInterface.removeIndex('ProductionProcess', 'unique_processcode_per_company');

    // Revert: Add back the single-field unique index
    await queryInterface.addIndex('ProductionProcess', ['processCode'], {
      unique: true,
      name: 'processCode'
    });
  }
};
