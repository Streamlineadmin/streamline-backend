module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('StoreItems', 'price', {
      type: Sequelize.FLOAT, // You can change it to INTEGER or DECIMAL if needed
      allowNull: false,
      defaultValue: 0.0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('StoreItems', 'price');
  }
};
