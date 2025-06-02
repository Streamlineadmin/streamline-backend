'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'ServiceConfirmationNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'ServiceConfirmationDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'ServiceConfirmationNumber');
    await queryInterface.removeColumn('Documents', 'ServiceConfirmationDate');
  }
};
