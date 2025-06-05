'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'companyTermsConditionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'CompanyTermsConditions', // Table name
        key: 'id', // Primary key to reference
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'companyTermsConditionId');
  }
};
