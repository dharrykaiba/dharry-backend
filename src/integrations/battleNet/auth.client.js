const axios = require("axios");
const config = require("../../config/config");

function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: config.blizzard.clientId,
    redirect_uri: config.blizzard.redirectUri,
    response_type: "code",
    scope: "wow.profile",
    state
  });
  return `https://oauth.battle.net/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.blizzard.redirectUri
  }).toString();
  const response = await axios.post("https://oauth.battle.net/token", body, {
    auth: { username: config.blizzard.clientId, password: config.blizzard.clientSecret },
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return response.data;
}

async function getUserInfo(accessToken) {
  const response = await axios.get("https://oauth.battle.net/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

function normalizeIdentity(userInfo) {
  const providerUserId = String(userInfo.sub ?? userInfo.id ?? "");
  if (!providerUserId) throw new Error("Battle.net no devolvió un identificador estable.");
  return {
    provider: "battle.net",
    providerUserId,
    providerEmail: userInfo.email || null,
    displayName: userInfo.battletag || userInfo.name || providerUserId,
    metadata: userInfo
  };
}

module.exports = { getAuthorizationUrl, exchangeCodeForToken, getUserInfo, normalizeIdentity };
