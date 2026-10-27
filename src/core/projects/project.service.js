const config = require("../../config/config");
const { Project } = require("../../models");
const repo = require("../../repositories/project.repository");

async function bootstrapProjects() {
  for (const project of config.projects.bootstrap) {
    await Project.findOrCreate({ where: { key: project.key }, defaults: project });
  }
}
async function getProjectsForUser(userId) {
  const { User } = require("../../models");
  const user = await User.findByPk(userId, { include: [{ association: "projects", through: { attributes: ["role", "status"] } }] });
  return user?.projects || [];
}
module.exports = { bootstrapProjects, getProjectsForUser, ensureMembership: repo.ensureMembership };
