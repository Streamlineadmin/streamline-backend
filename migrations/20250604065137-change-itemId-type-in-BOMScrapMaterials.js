'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMScrapMaterials', 'itemId', {
      type: Sequelize.STRING,
      allowNull: true, // set to false if itemId must be required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMScrapMaterials', 'itemId', {
      type: Sequelize.INTEGER,
      allowNull: true, // match original schema settings
    });
  }
};
