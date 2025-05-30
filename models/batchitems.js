'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class BatchItems extends Model {
    }

    BatchItems.init({
        documentNumber: DataTypes.STRING,
        companyId: DataTypes.INTEGER,
        item: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        iterationCount: DataTypes.INTEGER,
        quantity: DataTypes.FLOAT,
        barCodeNumber: {
            type: DataTypes.JSON,
            allowNull: true
        },
        manufacturingDate: DataTypes.STRING,
        expiryDate: DataTypes.STRING,
        store: DataTypes.STRING,
        outQuantity: DataTypes.FLOAT,
        isRejected:DataTypes.BOOLEAN,
        status: DataTypes.INTEGER,
        ip_address: DataTypes.STRING,
        createdBy: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'BatchItems',
    });

    return BatchItems;
};
