const projectService = require("../core/projects/project.service");
async function list(req, res) {
  const projects = req.session?.userId ? await projectService.getProjectsForUser(req.session.userId) : [];
  return res.json({ success: true, data: projects });
}
module.exports = { list };
