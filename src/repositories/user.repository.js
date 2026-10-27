const { User, UserIdentity } = require("../models");

async function findByIdentity(provider, providerUserId) {
  return UserIdentity.findOne({ where: { provider, providerUserId }, include: [{ model: User, as: "user" }] });
}

async function createFromIdentity({ provider, providerUserId, providerEmail, displayName, metadata }) {
  return User.sequelize.transaction(async (transaction) => {
    const user = await User.create({ displayName, email: providerEmail || null, emailVerified: Boolean(providerEmail) }, { transaction });
    const identity = await UserIdentity.create({ userId: user.id, provider, providerUserId, providerEmail: providerEmail || null, metadata: metadata || {} }, { transaction });
    return { user, identity };
  });
}

async function updateLogin(user, { displayName, providerEmail }) {
  const values = { lastLoginAt: new Date() };
  if (displayName && !user.displayName) values.displayName = displayName;
  if (providerEmail && !user.email) { values.email = providerEmail; values.emailVerified = true; }
  await user.update(values);
  return user;
}

module.exports = { findByIdentity, createFromIdentity, updateLogin };
