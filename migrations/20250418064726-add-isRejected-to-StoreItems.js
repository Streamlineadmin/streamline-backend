'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StoreItems', 'isRejected', {
      type: Sequelize.BOOLEAN,
      defaultValue: false, 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StoreItems', 'isRejected');
  }
};
