const { clearSessionCookie, json } = require("./_auth");

exports.handler = async () => json(200, { authenticated: false }, { "Set-Cookie": clearSessionCookie() });
