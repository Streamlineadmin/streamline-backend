'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BOMRawMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BOMRawMaterial.belongsTo(models.BOMDetails, {
        foreignKey: 'bomId',
        targetKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  BOMRawMaterial.init({
    bomId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.TEXT,
    uom: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    store: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    companyId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    parentId: DataTypes.INTEGER,
    conversionFactor: DataTypes.FLOAT,
    finishedGoodBomId: DataTypes.INTEGER, //reference from which bom it is linked
  }, {
    sequelize,
    modelName: 'BOMRawMaterial',
  });
  return BOMRawMaterial;
};