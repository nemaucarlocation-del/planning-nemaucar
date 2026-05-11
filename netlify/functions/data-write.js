const { getStore } = require("@netlify/blobs");
const { isAuthenticated, json } = require("./_auth");

function getConfiguredStore() {
  const siteID = process.env.NEMAUCAR_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NEMAUCAR_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore("nemaucar-planning", { siteID, token });
  }

  return getStore("nemaucar-planning");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!isAuthenticated(event)) {
    return json(401, { error: "Unauthorized." });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const data = body.data;
    if (!data || !Array.isArray(data.vehicles) || !Array.isArray(data.rentals)) {
      return json(400, { error: "Invalid data payload." });
    }

    const store = getConfiguredStore();
    await store.setJSON("app-data", data);
    return json(200, { saved: true });
  } catch (error) {
    console.error("data-write error", error);
    return json(500, { error: error?.message || "Impossible de sauvegarder les donnees." });
  }
};
