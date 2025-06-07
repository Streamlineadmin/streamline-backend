'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionProcess', 'companyId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('ProductionProcess', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionProcess', 'companyId');
    await queryInterface.removeColumn('ProductionProcess', 'userId');
  }
};