'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blogs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Blogs.belongsTo(models.BlogCategory, {
        foreignKey: 'blogCategory',
        as: 'category', 
      });
    }
  }
  Blogs.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    imageURL: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER,
    // New attributes
    URLTitle: {
      type: DataTypes.STRING,
      allowNull: true, // Change to false if it should be required
    },
    shortDesc: {
      type: DataTypes.TEXT, // or DataTypes.TEXT if needed
      allowNull: true // Adjust as needed
    },
    author: {
      type: DataTypes.STRING, // or DataTypes.TEXT if needed
      allowNull: false // Adjust as needed
    },
    blogCategory: {
      type: DataTypes.INTEGER, 
      allowNull: true, // Adjust as needed
      references: {
        model: 'BlogCategories', // Table name
        key: 'id', // Primary key in BlogCategories
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',  
    },
  }, {
    sequelize,
    modelName: 'Blogs',
  });
  return Blogs;
};