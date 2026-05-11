const { getStore } = require("@netlify/blobs");
const { isAuthenticated, json } = require("./_auth");

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

    const store = getStore("nemaucar-planning");
    await store.setJSON("app-data", data);
    return json(200, { saved: true });
  } catch {
    return json(500, { error: "Impossible de sauvegarder les donnees." });
  }
};
