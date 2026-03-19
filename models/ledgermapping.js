'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LedgerMapping extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LedgerMapping.init({
    type: DataTypes.STRING,
    subType: DataTypes.STRING,
    ledgerName: DataTypes.STRING,
    description: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
  });
  return LedgerMapping;
};