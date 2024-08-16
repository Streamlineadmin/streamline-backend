'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Blogs', 'shortDesc', {
      type: Sequelize.TEXT, // or Sequelize.TEXT if needed
      allowNull: true // Adjust as needed
    });
    await queryInterface.addColumn('Blogs', 'author', {
      type: Sequelize.STRING, // or Sequelize.TEXT if needed
      allowNull: false // Adjust as needed
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('Blogs', 'shortDesc');
     await queryInterface.removeColumn('Blogs', 'author');
  }
};
