'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Batches extends Model {
    }

    Batches.init({
        documentNumber: DataTypes.STRING,
        companyId: DataTypes.INTEGER,
        documentType: DataTypes.STRING,
        item: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: DataTypes.INTEGER,
        isRejected:DataTypes.BOOLEAN,
        ip_address: DataTypes.STRING,
        createdBy: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'Batches',
    });

    return Batches;
};
