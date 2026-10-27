"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sessions", "createdAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW")
    });

    await queryInterface.addColumn("Sessions", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW")
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Sessions", "updatedAt");
    await queryInterface.removeColumn("Sessions", "createdAt");
  }
};