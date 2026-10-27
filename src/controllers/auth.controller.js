const crypto = require("crypto");
const battleNet = require("../integrations/battleNet/auth.client");
const authService = require("../core/auth/auth.service");
const projectService = require("../core/projects/project.service");
const config = require("../config/config");

function beginLogin(req, res) {
  const provider = req.params.provider || "battle.net";
  if (provider !== "battle.net") return res.status(404).json({ success: false, error: { code: "UNSUPPORTED_PROVIDER", message: "Proveedor de autenticación no implementado." } });
  const state = crypto.randomBytes(32).toString("hex");
  req.session.oauthState = state;
  req.session.oauthStateCreatedAt = Date.now();
  return res.redirect(battleNet.getAuthorizationUrl(state));
}

function validOAuthState(req, state) {
  if (!state || !req.session.oauthState || state !== req.session.oauthState) return false;
  const age = Date.now() - Number(req.session.oauthStateCreatedAt || 0);
  delete req.session.oauthState;
  delete req.session.oauthStateCreatedAt;
  return age <= 10 * 60 * 1000;
}

async function callback(req, res) {
  const provider = req.params.provider || "battle.net";
  if (provider !== "battle.net") return res.status(404).json({ success: false, error: { code: "UNSUPPORTED_PROVIDER", message: "Proveedor de autenticación no implementado." } });
  const { code, state, error } = req.query;
  if (error) return res.status(400).json({ success: false, error: { code: "OAUTH_DENIED", message: "La autorización fue rechazada." } });
  if (!validOAuthState(req, state)) return res.status(400).json({ success: false, error: { code: "INVALID_OAUTH_STATE", message: "State inválido o expirado." } });
  if (!code) return res.status(400).json({ success: false, error: { code: "MISSING_AUTH_CODE", message: "Battle.net no devolvió un authorization code." } });

  try {
    const tokenData = await battleNet.exchangeCodeForToken(code);
    const battleNetUser = await battleNet.getUserInfo(tokenData.access_token);
    const identity = battleNet.normalizeIdentity(battleNetUser);
    const authResult = await authService.authenticateExternalIdentity(identity);

    req.session.userId = authResult.user.id;
    req.session.authenticated = true;
    req.session.provider = "battle.net";
    req.session.providerUserId = identity.providerUserId;
    req.session.battleNetUser = battleNetUser;
    req.session.battleNetAccessToken = tokenData.access_token;
    req.session.battleNetTokenExpiresAt = Date.now() + Number(tokenData.expires_in || 0) * 1000;

    return req.session.save((saveError) => {
      if (saveError) return res.status(500).json({ success: false, error: { code: "SESSION_SAVE_FAILED", message: "No se pudo guardar la sesión." } });
      return res.redirect(config.frontendUrl);
    });
  } catch (error) {
    console.error("OAuth Battle.net error:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ success: false, error: { code: "BATTLE_NET_AUTH_FAILED", message: "No se pudo completar la autenticación con Battle.net." } });
  }
}

async function session(req, res) {
  if (!req.session?.authenticated || !req.session.userId) return res.json({ success: true, data: { authenticated: false, user: null, projects: [] } });
  const projects = await projectService.getProjectsForUser(req.session.userId);
  return res.json({ success: true, data: { authenticated: true, user: req.session.battleNetUser || null, userId: req.session.userId, projects } });
}

async function logout(req, res) {
  return req.session.destroy((error) => {
    if (error) return res.status(500).json({ success: false, error: { code: "LOGOUT_FAILED", message: "No se pudo cerrar la sesión." } });
    res.clearCookie(config.session.name);
    return res.json({ success: true, data: { authenticated: false } });
  });
}

async function legacySession(req, res) {
  if (!req.session?.authenticated || !req.session.userId) return res.json({ authenticated: false });
  return res.json({ authenticated: true, user: req.session.battleNetUser || null });
}

module.exports = { beginLogin, callback, session, legacySession, logout };
