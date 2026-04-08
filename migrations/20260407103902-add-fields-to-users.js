'use strict';
 
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'msmeNumber', {
      type: Sequelize.STRING,
    });
 
    await queryInterface.addColumn('Users', 'range', {
      type: Sequelize.STRING,
    });
 
    await queryInterface.addColumn('Users', 'division', {
      type: Sequelize.STRING,
    });
 
    await queryInterface.addColumn('Users', 'commissionrate', {
      type: Sequelize.STRING,
    });
  },
 
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'msmeNumber');
    await queryInterface.removeColumn('Users', 'range');
    await queryInterface.removeColumn('Users', 'division');
    await queryInterface.removeColumn('Users', 'commissionrate');
  }
};
 