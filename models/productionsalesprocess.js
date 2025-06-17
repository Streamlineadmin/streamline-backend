"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class ProductionSalesProcess extends Model {
    }

    ProductionSalesProcess.init(
        {
            processName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: 1,
            },
            plannedTime: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            cost: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            },
            averageCost: {
                type: DataTypes.FLOAT,
            },
            currentaverageCost: {
                type: DataTypes.FLOAT,
            },
            totalPlannedTime: {
                type: DataTypes.TIME,
            },
            currentPlannedTime: {
                type: DataTypes.TIME,
            },
            productionId: { type: DataTypes.INTEGER },
        },
        {
            sequelize,
            modelName: "ProductionSalesProcess",
            tableName: "ProductionSalesProcess",
        }
    );

    return ProductionSalesProcess;
};
