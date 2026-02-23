'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    await queryInterface.addColumn("DocumentItems", "imageUrl", {
      type: DataTypes.STRING,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("DocumentItems", "imageUrl");
  }
};
