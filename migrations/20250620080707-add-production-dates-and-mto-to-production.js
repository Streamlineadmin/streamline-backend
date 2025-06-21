'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Production', 'productionStartDate', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Production', 'productionCompletionDate', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('Production', 'mto', {
      type: Sequelize.INTEGER,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Production', 'productionStartDate');
    await queryInterface.removeColumn('Production', 'productionCompletionDate');
    await queryInterface.removeColumn('Production', 'mto');
  },
};
