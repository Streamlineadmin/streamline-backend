'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Blogs', 'blogCategory', {
      type: Sequelize.INTEGER,
      allowNull: false, // Set to true if a blog can exist without a category
      references: {
        model: 'BlogCategories', // Table name in the database
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Change to 'CASCADE' if you want to delete related blogs when the category is deleted
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Blogs', 'blogCategory');
  }
};
