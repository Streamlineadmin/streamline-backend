'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Documents', 'salesReturnNumber', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Documents', 'salesReturnDate', {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Documents', 'salesReturnNumber');
    await queryInterface.removeColumn('Documents', 'salesReturnDate');
  },
};
