'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Items extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Items.hasMany(models.DocumentItems, {
        foreignKey: 'itemId',
        as: 'documentItems',
      });
    }    
  }
  Items.init({
    itemName: DataTypes.STRING,
    itemType: DataTypes.INTEGER,
    category: DataTypes.INTEGER,
    subCategory: DataTypes.INTEGER,
    microCategory: DataTypes.INTEGER,
    alternateUnit: DataTypes.INTEGER,
    conversionFactor: DataTypes.FLOAT,
    metricsUnit: DataTypes.INTEGER,
    HSNCode: DataTypes.STRING,
    price: DataTypes.FLOAT,
    taxType: DataTypes.INTEGER,
    tax: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    currentStock: DataTypes.INTEGER,
    minStock: DataTypes.INTEGER,
    maxStock: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    companyId: DataTypes.INTEGER,
    itemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status: DataTypes.INTEGER,
    customFields: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Items',
  });


  return Items;
};