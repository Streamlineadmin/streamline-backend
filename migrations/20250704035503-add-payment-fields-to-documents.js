'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'creditSetOff', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('Documents', 'debitSetOff', {
      type: Sequelize.FLOAT,
    });

    await queryInterface.addColumn('Documents', 'amountPaid', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'creditSetOff');
    await queryInterface.removeColumn('Documents', 'debitSetOff');
    await queryInterface.removeColumn('Documents', 'amountPaid');
  }
};
