'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('PackagingMasters', 'length', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.changeColumn('PackagingMasters', 'width', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.changeColumn('PackagingMasters', 'height', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.changeColumn('PackagingMasters', 'tareWeight', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('PackagingMasters', 'length', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
    await queryInterface.changeColumn('PackagingMasters', 'width', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
    await queryInterface.changeColumn('PackagingMasters', 'height', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
    await queryInterface.changeColumn('PackagingMasters', 'tareWeight', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
  }
};
