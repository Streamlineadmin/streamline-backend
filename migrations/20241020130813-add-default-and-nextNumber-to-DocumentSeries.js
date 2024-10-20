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
    await queryInterface.addColumn('DocumentSeries', 'default', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: false, // Set the default value as needed
    });

    await queryInterface.addColumn('DocumentSeries', 'nextNumber', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1, // Set the initial next number as needed
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('DocumentSeries', 'default');
    await queryInterface.removeColumn('DocumentSeries', 'nextNumber');
  }
};
