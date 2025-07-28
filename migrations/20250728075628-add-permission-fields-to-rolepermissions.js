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
    await queryInterface.addColumn('RolePermissions', 'permission', {
      type: Sequelize.STRING,
      allowNull: true, // or false if required
    });

    await queryInterface.addColumn('RolePermissions', 'subpermission', {
      type: Sequelize.STRING,
      allowNull: true, // or false if required
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('RolePermissions', 'permission');
    await queryInterface.removeColumn('RolePermissions', 'subpermission');
  }
};
