'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('StoreItems', 'quantity', {
      type: Sequelize.FLOAT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('StoreItems', 'quantity', {
      type: Sequelize.INTEGER,
    });
  }
};
