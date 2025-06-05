'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'tax', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'total', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'price', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'tax', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('DocumentAdditionalCharges', 'total', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};