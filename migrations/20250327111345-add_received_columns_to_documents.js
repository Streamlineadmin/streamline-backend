'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DocumentItems', 'receivedQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('DocumentItems', 'receivedToday', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('DocumentItems', 'pendingQuantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DocumentItems', 'receivedQuantity');
    await queryInterface.removeColumn('DocumentItems', 'receivedToday');
    await queryInterface.removeColumn('DocumentItems', 'pendingQuantity');
  }
};
