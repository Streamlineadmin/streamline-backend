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
    await queryInterface.addColumn('Documents', 'paymentDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'POCName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'POCNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'POCDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'OCNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'OCDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'transporterName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'TGNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'TDNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'TDDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'VehicleNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'replyDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'Attention', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'invoiceNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'invoiceDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'billDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'returnRecieveDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'creditNoteNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Documents', 'creditNotedate', {
      type: Sequelize.DATE,
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
    await queryInterface.removeColumn('Documents', 'paymentDate');
    await queryInterface.removeColumn('Documents', 'POCName');
    await queryInterface.removeColumn('Documents', 'POCNumber');
    await queryInterface.removeColumn('Documents', 'POCDate');
    await queryInterface.removeColumn('Documents', 'OCNumber');
    await queryInterface.removeColumn('Documents', 'OCDate');
    await queryInterface.removeColumn('Documents', 'transporterName');
    await queryInterface.removeColumn('Documents', 'TGNumber');
    await queryInterface.removeColumn('Documents', 'TDNumber');
    await queryInterface.removeColumn('Documents', 'TDDate');
    await queryInterface.removeColumn('Documents', 'VehicleNumber');
    await queryInterface.removeColumn('Documents', 'replyDate');
    await queryInterface.removeColumn('Documents', 'Attention');
    await queryInterface.removeColumn('Documents', 'invoiceNumber');
    await queryInterface.removeColumn('Documents', 'invoiceDate');
    await queryInterface.removeColumn('Documents', 'billDate');
    await queryInterface.removeColumn('Documents', 'returnRecieveDate');
    await queryInterface.removeColumn('Documents', 'creditNoteNumber');
    await queryInterface.removeColumn('Documents', 'creditNotedate');
  }
};
