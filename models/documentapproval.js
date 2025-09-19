'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentApproval extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentApproval.init({
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    documents: DataTypes.JSON
  }, {
    sequelize,
  });
  return DocumentApproval;
};