'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Items', 'tax', {
      type: Sequelize.FLOAT,  // or Sequelize.DECIMAL, depending on your requirement
      allowNull: false,       // adjust based on your requirements
      defaultValue: 0,        // optional default value
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Items', 'tax');
  }
};
