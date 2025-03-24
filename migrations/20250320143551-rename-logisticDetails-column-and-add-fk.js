module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Documents', 'logisticDetailsId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Documents', 'fk_logisticDetailsId');
  },
};
