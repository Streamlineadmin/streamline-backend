'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('Documents', 'document_reference', 'is_refered');

    await queryInterface.changeColumn('Documents', 'is_refered', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Documents', 'is_refered', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.renameColumn('Documents', 'is_refered', 'document_reference');
  }
};