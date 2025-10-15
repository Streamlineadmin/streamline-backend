'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'serviceOrderNumber', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Documents', 'serviceOrderDate', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'serviceOrderNumber');
    await queryInterface.removeColumn('Documents', 'serviceOrderDate');
  }
};
