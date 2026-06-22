'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Documents", "portOfLoading", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "portOfDischarge", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "countryOfOrigin", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "countryOfDischarge", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "finalDestination", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "countryOfFinalDestination", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "lcNumber", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "lcIssueBank", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "lutNumber", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "lutValidTill", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "containerNumber", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "endUserCode", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Documents", "portOfLoading");
    await queryInterface.removeColumn("Documents", "portOfDischarge");
    await queryInterface.removeColumn("Documents", "countryOfOrigin");
    await queryInterface.removeColumn("Documents", "countryOfDischarge");
    await queryInterface.removeColumn("Documents", "finalDestination");
    await queryInterface.removeColumn("Documents", "countryOfFinalDestination");
    await queryInterface.removeColumn("Documents", "lcNumber");
    await queryInterface.removeColumn("Documents", "lcIssueBank");
    await queryInterface.removeColumn("Documents", "lutNumber");
    await queryInterface.removeColumn("Documents", "lutValidTill");
    await queryInterface.removeColumn("Documents", "containerNumber");
    await queryInterface.removeColumn("Documents", "endUserCode");
  },
};
