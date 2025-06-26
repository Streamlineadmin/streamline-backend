'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('logTDs', 'tdsAmount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('logTDs', 'totalAmountAfterDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('logTDs', 'tdsAmount', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.changeColumn('logTDs', 'totalAmountAfterDeduction', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  }
};
