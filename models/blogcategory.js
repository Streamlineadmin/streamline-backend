'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BlogCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BlogCategory.hasMany(models.Blogs, {
        foreignKey: 'blogCategory',
        as: 'blogs', 
      });
    }
  }
  BlogCategory.init({
    category: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'BlogCategory',
  });
  return BlogCategory;
};