'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BatchItems', 'store', {
      type: Sequelize.STRING,

    });
    await queryInterface.addColumn('BatchItems', 'outQuantity', {
      type: Sequelize.FLOAT,

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BatchItems', 'store');
    await queryInterface.removeColumn('BatchItems', 'outQuantity');
  },
};
