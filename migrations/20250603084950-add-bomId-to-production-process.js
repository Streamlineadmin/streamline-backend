module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ProductionProcess", "bomId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "BOMDetails",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ProductionProcess", "bomId");
  },
};
