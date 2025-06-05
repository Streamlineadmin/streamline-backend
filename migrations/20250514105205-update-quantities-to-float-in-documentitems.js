'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DocumentItems', 'quantity', {
      type: Sequelize.FLOAT,
    });
    await queryInterface.changeColumn('DocumentItems', 'receivedToday', {
      type: Sequelize.FLOAT,
    });
    await queryInterface.changeColumn('DocumentItems', 'pendingQuantity', {
      type: Sequelize.FLOAT,
    });
    await queryInterface.changeColumn('DocumentItems', 'receivedQuantity', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DocumentItems', 'quantity', {
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('DocumentItems', 'receivedToday', {
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('DocumentItems', 'pendingQuantity', {
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('DocumentItems', 'receivedQuantity', {
      type: Sequelize.INTEGER,
    });
  }
};
