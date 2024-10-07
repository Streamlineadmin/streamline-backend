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
    up: async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('Items', 'itemId', {
        type: Sequelize.STRING
      });
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    down: async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('Items', 'itemId', {
        type: Sequelize.INTEGER
      });
    }
  }
};
