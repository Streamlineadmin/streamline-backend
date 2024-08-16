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
    }
  }
  Blogs.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    shortDesc: DataTypes.Text,
    imageURL: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    author: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Blogs',
  });
  return Blogs;
};