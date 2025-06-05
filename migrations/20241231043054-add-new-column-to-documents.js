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
    await queryInterface.addColumn('Documents', 'quotationNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'quotationDate', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'orderConfirmationNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'orderConfirmationDate', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'purchaseOrderNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'purchaseOrderDate', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'grn_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Documents', 'grn_Date', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Documents', 'quotationNumber');
    await queryInterface.removeColumn('Documents', 'quotationDate');
    await queryInterface.removeColumn('Documents', 'orderConfirmationNumber');
    await queryInterface.removeColumn('Documents', 'orderConfirmationDate');
    await queryInterface.removeColumn('Documents', 'purchaseOrderNumber');
    await queryInterface.removeColumn('Documents', 'purchaseOrderDate');
    await queryInterface.removeColumn('Documents', 'grn_number');
    await queryInterface.removeColumn('Documents', 'grn_Date');
  }
};
