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
      queryInterface.addColumn('Documents', 'indent_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'supplier_invoice_number', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'supplier_invoice_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'challan_number', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'challan_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'inspection_date', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'pay_to_transporter', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'debit_note_number', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('Documents', 'debit_note_date', {
        type: Sequelize.STRING,
        allowNull: true,
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.removeColumn('Documents', 'indent_date'),
    queryInterface.removeColumn('Documents', 'supplier_invoice_number'),
    queryInterface.removeColumn('Documents', 'supplier_invoice_date'),
    queryInterface.removeColumn('Documents', 'challan_number'),
    queryInterface.removeColumn('Documents', 'challan_date'),
    queryInterface.removeColumn('Documents', 'inspection_date'),
    queryInterface.removeColumn('Documents', 'pay_to_transporter'),
    queryInterface.removeColumn('Documents', 'debit_note_number'),
    queryInterface.removeColumn('Documents', 'debit_note_date')
  }
};
