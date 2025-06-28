'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('LogPayments', 'logPayment', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('LogPayments', 'amountPaid', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('LogPayments', 'logPayment', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.changeColumn('LogPayments', 'amountPaid', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  }
};
