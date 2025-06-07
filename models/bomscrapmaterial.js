'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BOMScrapMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BOMScrapMaterial.belongsTo(models.BOMDetails, {
        foreignKey: 'bomId',
        targetKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  BOMScrapMaterial.init({
    bomId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    uom: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    store: DataTypes.STRING,
    costAllocationPercent: DataTypes.FLOAT,
    userId: DataTypes.INTEGER,
    companyId: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BOMScrapMaterial',
  });
  return BOMScrapMaterial;
};