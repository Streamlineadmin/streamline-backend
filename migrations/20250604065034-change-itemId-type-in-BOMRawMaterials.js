'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMRawMaterials', 'itemId', {
      type: Sequelize.STRING,
      allowNull: true, // set to false if `itemId` is required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMRawMaterials', 'itemId', {
      type: Sequelize.INTEGER,
      allowNull: true, // adjust based on original schema
    });
  }
};
