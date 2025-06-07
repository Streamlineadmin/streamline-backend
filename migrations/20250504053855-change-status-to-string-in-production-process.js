'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ProductionProcess', 'status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'active',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ProductionProcess', 'status', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  }
};