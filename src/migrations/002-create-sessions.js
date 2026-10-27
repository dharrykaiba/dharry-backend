const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("Sessions", {
      sid: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      data: { type: DataTypes.TEXT, allowNull: true }
    });
    await queryInterface.addIndex("Sessions", ["expires"], { name: "sessions_expires_idx" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("Sessions");
  }
};
