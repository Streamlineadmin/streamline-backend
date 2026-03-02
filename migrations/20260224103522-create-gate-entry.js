'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("GateEntries", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: Sequelize.INTEGER,
      },

      documentNumber: {
        type: Sequelize.STRING,
      },

      vistorName: {
        type: Sequelize.STRING,
      },

      visitorContact: {
        type: Sequelize.STRING,
      },

      visitorEmail: {
        type: Sequelize.STRING,
      },

      visitorCompany: {
        type: Sequelize.STRING,
      },

      idProofType: {
        type: Sequelize.STRING,
      },

      idProofNumber: {
        type: Sequelize.STRING,
      },

      purposeOfVisit: {
        type: Sequelize.STRING,
      },

      visitorImageUrl: {
        type: Sequelize.STRING,
      },

      personToMeet: {
        type: Sequelize.STRING,
      },

      vehicleNumber: {
        type: Sequelize.STRING,
      },

      vehicleType: {
        type: Sequelize.STRING,
      },

      comments: {
        type: Sequelize.STRING,
      },

      companyId: {
        type: Sequelize.INTEGER,
      },

      status: {
        type: Sequelize.INTEGER,
      },

      securitySignatureUrl: {
        type: Sequelize.STRING,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("GateEntries");
  },
};
