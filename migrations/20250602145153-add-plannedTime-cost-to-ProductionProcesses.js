'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionProcess', 'plannedTime', {
      type: Sequelize.TIME,
      allowNull: true,
    });

    await queryInterface.addColumn('ProductionProcess', 'cost', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionProcess', 'plannedTime');
    await queryInterface.removeColumn('ProductionProcess', 'cost');
  }
};
