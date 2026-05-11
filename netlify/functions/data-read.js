const { getStore } = require("@netlify/blobs");
const { isAuthenticated, json } = require("./_auth");

const emptyData = {
  vehicles: [],
  rentals: [],
  customers: [],
};

exports.handler = async (event) => {
  if (!isAuthenticated(event)) {
    return json(401, { error: "Unauthorized." });
  }

  try {
    const store = getStore("nemaucar-planning");
    const data = (await store.get("app-data", { type: "json" })) || emptyData;
    return json(200, { data });
  } catch (error) {
    console.error("data-read error", error);
    return json(500, { error: error?.message || "Impossible de lire les donnees." });
  }
};
