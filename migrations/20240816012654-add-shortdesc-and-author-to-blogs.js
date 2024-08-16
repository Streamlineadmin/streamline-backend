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
     await queryInterface.addColumn('Blogs', 'shortDesc', {
      type: Sequelize.STRING,
      allowNull: true // or false
    });
    await queryInterface.addColumn('Blogs', 'author', {
      type: Sequelize.STRING,
      allowNull: false // or true
    });
  },

  async down (queryInterface, Sequelize) {
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
