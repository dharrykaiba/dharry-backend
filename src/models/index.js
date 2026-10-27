const User = require("./User");
const UserIdentity = require("./UserIdentity");
const Project = require("./Project");
const UserProject = require("./UserProject");

User.hasMany(UserIdentity, { foreignKey: "userId", as: "identities", onDelete: "CASCADE" });
UserIdentity.belongsTo(User, { foreignKey: "userId", as: "user" });
User.belongsToMany(Project, { through: UserProject, foreignKey: "userId", otherKey: "projectId", as: "projects" });
Project.belongsToMany(User, { through: UserProject, foreignKey: "projectId", otherKey: "userId", as: "users" });
UserProject.belongsTo(User, { foreignKey: "userId", as: "user" });
UserProject.belongsTo(Project, { foreignKey: "projectId", as: "project" });
User.hasMany(UserProject, { foreignKey: "userId", as: "projectMemberships", onDelete: "CASCADE" });
Project.hasMany(UserProject, { foreignKey: "projectId", as: "memberships", onDelete: "CASCADE" });

module.exports = { User, UserIdentity, Project, UserProject };
