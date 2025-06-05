'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DocumentItems', 'auQuantity', {
      type: Sequelize.FLOAT,
    });
    await queryInterface.addColumn('DocumentItems', 'alternateUnit', {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DocumentItems', 'auQuantity');
    await queryInterface.removeColumn('DocumentItems', 'alternateUnit');
  }
};
