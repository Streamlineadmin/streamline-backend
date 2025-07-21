'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('ProductionProcess', 'plannedTime', {
    type: Sequelize.STRING,
    allowNull: true,
  });
},

down: async (queryInterface, Sequelize) => {
  await queryInterface.changeColumn('ProductionProcess', 'plannedTime', {
    type: Sequelize.TIME,
    allowNull: true,
  });
}
};
