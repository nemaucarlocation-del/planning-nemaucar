const { getStore } = require("@netlify/blobs");
const { isAuthenticated, json } = require("./_auth");

const emptyData = {
  vehicles: [],
  rentals: [],
  customers: [],
};

function getConfiguredStore() {
  const siteID = process.env.NEMAUCAR_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NEMAUCAR_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore("nemaucar-planning", { siteID, token });
  }

  return getStore("nemaucar-planning");
}

exports.handler = async (event) => {
  if (!isAuthenticated(event)) {
    return json(401, { error: "Unauthorized." });
  }

  try {
    const store = getConfiguredStore();
    const data = (await store.get("app-data", { type: "json" })) || emptyData;
    return json(200, { data });
  } catch (error) {
    console.error("data-read error", error);
    return json(500, { error: error?.message || "Impossible de lire les donnees." });
  }
};
