const axios = require("axios");
const config = require("../../config/config");
const api = axios.create({ timeout: 15000 });

function namespace(product, region) { return `${product.namespacePrefix}-${region}`; }

async function getProfileByProduct(accessToken, product, region) {
  const ns = namespace(product, region);
  const baseUrl = `https://${region}.api.blizzard.com`;
  try {
    const response = await api.get(`${baseUrl}/profile/user/wow`, {
      params: { namespace: ns, locale: "en_US" },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return { success: true, product: { id: product.id, name: product.name }, region: { id: region }, namespace: ns, data: response.data };
  } catch (error) {
    return { success: false, product: { id: product.id, name: product.name }, region: { id: region }, namespace: ns, error: { status: error.response?.status || 500, details: error.response?.data || null, message: error.message } };
  }
}

async function getAllProfiles(accessToken) {
  const requests = [];
  for (const region of config.wowRegions) for (const product of config.wowProducts) requests.push(getProfileByProduct(accessToken, product, region.id));
  const results = await Promise.all(requests);
  const products = {};
  for (const result of results) {
    products[result.product.id] ||= {};
    products[result.product.id][result.region.id] = result;
  }
  return { requestedAt: new Date().toISOString(), products };
}

module.exports = { getProfileByProduct, getAllProfiles };
