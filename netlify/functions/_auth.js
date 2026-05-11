const crypto = require("node:crypto");

const sessionCookieName = "nemaucar_session";
const sessionDurationSeconds = 60 * 60 * 24 * 14;

function getConfig() {
  const password = process.env.NEMAUCAR_APP_PASSWORD;
  const secret = process.env.NEMAUCAR_SESSION_SECRET || password;

  if (!password || !secret) {
    throw new Error("Missing Netlify environment variables.");
  }

  return { password, secret };
}

function parseCookies(headerValue = "") {
  return headerValue
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split("=");
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

function signToken(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function createSessionCookie() {
  const { secret } = getConfig();
  const expiresAt = Date.now() + sessionDurationSeconds * 1000;
  const payload = String(expiresAt);
  const signature = signToken(secret, payload);
  const token = `${payload}.${signature}`;

  return `${sessionCookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${sessionDurationSeconds}`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function isAuthenticated(event) {
  try {
    const { secret } = getConfig();
    const cookies = parseCookies(event.headers.cookie || "");
    const token = cookies[sessionCookieName];
    if (!token) return false;

    const [expiresAt, signature] = token.split(".");
    if (!expiresAt || !signature) return false;
    if (Date.now() > Number(expiresAt)) return false;

    const expected = signToken(secret, expiresAt);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function json(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  };
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  getConfig,
  isAuthenticated,
  json,
};
