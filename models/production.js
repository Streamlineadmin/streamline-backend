'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Production extends Model {
        static associate(models) {
        }
    }
    Production.init({
        companyId: DataTypes.INTEGER,
        productionId: DataTypes.STRING,
        documentNumber: DataTypes.STRING,
        bomId: DataTypes.INTEGER,
        productionEndDate: DataTypes.STRING,
        assignedTo: DataTypes.INTEGER,
        productionStartDate: DataTypes.STRING,
        productionCompletionDate: DataTypes.STRING,
        mto: DataTypes.INTEGER,
        createdBy: DataTypes.INTEGER,
        ip_address: DataTypes.STRING,
        status: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'Production',
        freezeTableName: true,
        tableName: 'Production',
    });
    return Production;
};