'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('DocumentItems', 'ServiceID', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('DocumentItems', 'ServiceName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('DocumentItems', 'ServiceID');
    await queryInterface.removeColumn('DocumentItems', 'ServiceName');
  }
};
