'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionRawMaterials', 'currentAverage', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionRawMaterials', 'currentAverage');
  }
};
