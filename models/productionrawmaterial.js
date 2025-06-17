'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionRawMaterials extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
        }
    }
    ProductionRawMaterials.init({
        productionId: DataTypes.INTEGER,
        itemId: DataTypes.STRING,
        itemName: DataTypes.STRING,
        uom: DataTypes.STRING,
        quantity: DataTypes.FLOAT,
        store: DataTypes.STRING,
        issuedQuantity: DataTypes.FLOAT,
        averagePrice: DataTypes.FLOAT,
        consumedQuantity: DataTypes.FLOAT,
        currentAverage:DataTypes.FLOAT,
        status: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ProductionRawMaterials',
    });
    return ProductionRawMaterials;
};