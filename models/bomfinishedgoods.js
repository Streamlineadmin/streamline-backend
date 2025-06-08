'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BOMFinishedGoods extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       BOMFinishedGoods.belongsTo(models.BOMDetails, {
        foreignKey: 'bomId',
        targetKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  BOMFinishedGoods.init({
    bomId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    uom: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    store: DataTypes.STRING,
    costAllocation: DataTypes.FLOAT,
    userId: DataTypes.INTEGER,
    companyId: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BOMFinishedGoods',
  });
  return BOMFinishedGoods;
};