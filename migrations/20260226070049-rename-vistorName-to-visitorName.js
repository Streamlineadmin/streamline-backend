'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('GateEntries', 'vistorName', 'visitorName');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('GateEntries', 'visitorName', 'vistorName');
  }
};
