'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('CompanyTermsConditions', 'termsCondition', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('CompanyTermsConditions', 'termsCondition', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }
};
