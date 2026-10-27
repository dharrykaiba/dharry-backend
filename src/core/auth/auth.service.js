const userRepository = require("../../repositories/user.repository");
const projectService = require("../projects/project.service");
const projectRepository = require("../../repositories/project.repository");

async function authenticateExternalIdentity({ provider, providerUserId, providerEmail, displayName, metadata }) {
  let identity = await userRepository.findByIdentity(provider, providerUserId);
  let user;
  let created = false;

  if (identity) {
    user = await userRepository.updateLogin(identity.user, { displayName, providerEmail });
  } else {
    const createdData = await userRepository.createFromIdentity({ provider, providerUserId, providerEmail, displayName, metadata });
    user = createdData.user;
    identity = createdData.identity;
    created = true;
  }

  await projectService.bootstrapProjects();
  const defaultProject = await projectRepository.findByKey("dharrystats");
  const membership = await projectRepository.ensureMembership(user.id, defaultProject.id);
  return { user, identity, created, membership };
}

module.exports = { authenticateExternalIdentity };
