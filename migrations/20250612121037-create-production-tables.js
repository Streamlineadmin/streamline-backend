'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ProductionAdditionalCharges', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productionId: Sequelize.INTEGER,
      chargesName: Sequelize.STRING,
      amount: Sequelize.FLOAT,
      status: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('ProductionFinishedGoods', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productionId: Sequelize.INTEGER,
      itemId: Sequelize.STRING,
      itemName: Sequelize.STRING,
      uom: Sequelize.STRING,
      quantity: Sequelize.FLOAT,
      store: Sequelize.STRING,
      costAllocation: Sequelize.FLOAT,
      status: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('ProductionRawMaterials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productionId: Sequelize.INTEGER,
      itemId: Sequelize.STRING,
      itemName: Sequelize.STRING,
      uom: Sequelize.STRING,
      quantity: Sequelize.FLOAT,
      store: Sequelize.STRING,
      issuedQuantity: Sequelize.FLOAT,
      averagePrice: Sequelize.FLOAT,
      consumedQuantity: Sequelize.FLOAT,
      status: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('ProductionSalesProcess', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      processName: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: true, defaultValue: 1 },
      plannedTime: { type: Sequelize.TIME, allowNull: true },
      cost: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      productionId: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.createTable('ProductionScrapMaterials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      productionId: Sequelize.INTEGER,
      itemId: Sequelize.STRING,
      itemName: Sequelize.STRING,
      uom: Sequelize.STRING,
      quantity: Sequelize.FLOAT,
      store: Sequelize.STRING,
      costAllocationPercent: Sequelize.FLOAT,
      status: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProductionAdditionalCharges');
    await queryInterface.dropTable('ProductionFinishedGoods');
    await queryInterface.dropTable('ProductionRawMaterials');
    await queryInterface.dropTable('ProductionSalesProcess');
    await queryInterface.dropTable('ProductionScrapMaterials');
  }
};
