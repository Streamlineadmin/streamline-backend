'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductionFinishedGoods', 'costOfRejectedQuantity', {
      type: Sequelize.FLOAT,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductionFinishedGoods', 'costOfRejectedQuantity');
  }
};
