'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentAttachments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentAttachments.init({
    documentNumber: DataTypes.STRING,
    attachmentName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DocumentAttachments',
  });
  return DocumentAttachments;
};