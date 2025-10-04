'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Items', 'itemId', {
      type: Sequelize.STRING(30),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Items', 'itemId', {
      type: Sequelize.STRING(11),
    });
  }
};
