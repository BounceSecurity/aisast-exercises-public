const axios = require("axios");

// BAD: concat into a URL — the host comes from the client, the
// path is hardcoded. Still SSRF.
async function callbackHandler(req, res) {
  const host = req.body.host;
  await axios.get("https://" + host + "/callback");
  res.sendStatus(204);
}

module.exports = { callbackHandler };
