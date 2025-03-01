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
    await queryInterface.changeColumn('TermsConditions', 'description', {
      type: Sequelize.TEXT, // Change from STRING to TEXT
      allowNull: true, // Allow null values if needed
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('TermsConditions', 'description', {
      type: Sequelize.STRING, // Revert back to STRING (255 chars) if needed
      allowNull: true,
    });
  }
};
