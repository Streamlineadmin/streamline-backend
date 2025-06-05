'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BatchItems', 'isRejected', {
      type: Sequelize.BOOLEAN,
    });

    await queryInterface.addColumn('Batches', 'isRejected', {
      type: Sequelize.BOOLEAN,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BatchItems', 'isRejected');
    await queryInterface.removeColumn('Batches', 'isRejected');
  }
};
