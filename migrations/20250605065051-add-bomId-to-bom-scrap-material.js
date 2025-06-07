'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BOMScrapMaterials', 'bomId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'BOMDetails',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BOMScrapMaterials', 'bomId');
  },
};
