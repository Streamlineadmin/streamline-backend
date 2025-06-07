'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMFinishedGoods', 'itemId', {
      type: Sequelize.STRING,
      allowNull: true, // change to false if itemId is required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('BOMFinishedGoods', 'itemId', {
      type: Sequelize.INTEGER,
      allowNull: true, // change to false if originally required
    });
  }
};
