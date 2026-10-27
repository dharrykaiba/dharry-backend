const { DataTypes } = require("sequelize");
const { sequelize } = require("../core/database");

module.exports = sequelize.define("Project", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" }
}, { tableName: "projects", underscored: true });
