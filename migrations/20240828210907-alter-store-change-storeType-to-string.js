'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('Stores', 'storeType', {
      type: Sequelize.STRING,
      allowNull: false // or true, depending on your requirement
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('Stores', 'storeType', {
      type: Sequelize.INTEGER,
      allowNull: false // or true, depending on your requirement
    });
  }
};
