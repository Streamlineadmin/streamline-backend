'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class NewsLetter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  NewsLetter.init(    {
    email: DataTypes.STRING,
    pageId: DataTypes.STRING,
    ip_address:DataTypes.STRING,
    status: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'NewsLetter',
    timestamps: true,
  });
  return NewsLetter;
}; 