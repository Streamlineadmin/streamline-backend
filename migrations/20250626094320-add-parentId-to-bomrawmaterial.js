'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BOMRawMaterials', 'parentId', {
      type: Sequelize.INTEGER,
      allowNull: true // or false as per requirement
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BOMRawMaterials', 'parentId');
  }
};
