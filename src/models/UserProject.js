const { DataTypes } = require("sequelize");
const { sequelize } = require("../core/database");

module.exports = sequelize.define("UserProject", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
  projectId: { type: DataTypes.UUID, allowNull: false, field: "project_id" },
  role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "user" },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" }
}, { tableName: "user_projects", underscored: true, indexes: [{ unique: true, fields: ["user_id", "project_id"] }] });
