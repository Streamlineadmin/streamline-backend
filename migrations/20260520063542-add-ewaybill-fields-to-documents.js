'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Documents", "ewayBillValidTill", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "ewayBillDate", {
      type: Sequelize.STRING,
    });

    await queryInterface.addColumn("Documents", "ewayBillNumber", {
      type: Sequelize.STRING,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "Documents",
      "ewayBillValidTill"
    );

    await queryInterface.removeColumn(
      "Documents",
      "ewayBillDate"
    );

    await queryInterface.removeColumn(
      "Documents",
      "ewayBillNumber"
    );
  },
};
