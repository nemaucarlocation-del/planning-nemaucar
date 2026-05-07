const { isAuthenticated, json } = require("./_auth");

exports.handler = async (event) => json(200, { authenticated: isAuthenticated(event) });
