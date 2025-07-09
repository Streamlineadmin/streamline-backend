'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('AlternateUnits', {
      fields: ['itemId', 'alternateUnits'],
      type: 'unique',
      name: 'unique_itemId_alternateUnits'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AlternateUnits', 'unique_itemId_alternateUnits');
  }
};
