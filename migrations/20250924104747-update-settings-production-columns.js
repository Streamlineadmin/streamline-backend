'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // remove old column
    await queryInterface.removeColumn('Settings', 'production');

    // add new columns
    await queryInterface.addColumn('Settings', 'productionFinishedGood', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'productionRawMaterial', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Settings', 'productionScrapMaterial', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    // rollback: remove new columns
    await queryInterface.removeColumn('Settings', 'productionFinishedGood');
    await queryInterface.removeColumn('Settings', 'productionRawMaterial');
    await queryInterface.removeColumn('Settings', 'productionScrapMaterial');

    // add back old column
    await queryInterface.addColumn('Settings', 'production', {
      type: Sequelize.STRING,
    });
  }
};
