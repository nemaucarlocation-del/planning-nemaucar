const { createSessionCookie, getConfig, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const { password } = getConfig();
    const body = JSON.parse(event.body || "{}");
    if (body.password !== password) {
      return json(401, { error: "Mot de passe incorrect." });
    }

    return json(200, { authenticated: true }, { "Set-Cookie": createSessionCookie() });
  } catch {
    return json(500, { error: "Configuration Netlify incomplete." });
  }
};
