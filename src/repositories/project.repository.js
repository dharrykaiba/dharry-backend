const { Project, UserProject } = require("../models");

async function findByKey(key) { return Project.findOne({ where: { key } }); }
async function listActive() { return Project.findAll({ where: { status: "active" }, order: [["key", "ASC"]] }); }
async function ensureMembership(userId, projectId, role = "user") {
  const [membership] = await UserProject.findOrCreate({ where: { userId, projectId }, defaults: { role, status: "active" } });
  return membership;
}
module.exports = { findByKey, listActive, ensureMembership };
