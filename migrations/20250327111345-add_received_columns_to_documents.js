'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'receivedQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'receivedToday', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'pendingQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'receivedQuantity');
    await queryInterface.removeColumn('Documents', 'receivedToday');
    await queryInterface.removeColumn('Documents', 'pendingQuantity');
  }
};
