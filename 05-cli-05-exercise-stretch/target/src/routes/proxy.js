const axios = require("axios");

// BAD: classic SSRF. The destination URL is whatever the client
// asks for. Internal IPs, AWS metadata, anything goes.
async function proxyHandler(req, res) {
  const url = req.query.url;
  const upstream = await axios.get(url);
  res.send(upstream.data);
}

module.exports = { proxyHandler };
