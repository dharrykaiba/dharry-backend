const wowClient = require("../../integrations/battleNet/wow.client");

async function profile(req, res) {
  const accessToken = req.session?.battleNetAccessToken;
  if (!req.session?.authenticated || !accessToken) return res.status(401).json({ success: false, error: { code: "AUTH_REQUIRED", message: "Debes iniciar sesión con Battle.net." } });
  if (req.session.battleNetTokenExpiresAt && Date.now() >= req.session.battleNetTokenExpiresAt - 60_000) return res.status(401).json({ success: false, error: { code: "BLIZZARD_TOKEN_EXPIRED", message: "La sesión de Battle.net debe renovarse." } });

  try {
    const data = await wowClient.getAllProfiles(accessToken);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("WoW profile error:", error.message);
    return res.status(500).json({ success: false, error: { code: "WOW_PROFILE_FAILED", message: "No se pudo consultar el perfil de World of Warcraft." } });
  }
}

module.exports = { profile };
