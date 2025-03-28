'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Items', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true, // Keep this as per your existing schema
    });
  },
 
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Items', 'price', {
      type: Sequelize.INTEGER,
      allowNull: true, // Revert back if needed
    });
  }
};
