const axios = require("axios");
const { validateUrl } = require("../sanitizers");

// OK: client URL is washed through the allowlist before use.
async function fireWebhook(req, res) {
  const safe = validateUrl(req.body.callbackUrl);
  await axios.post(safe, req.body.payload);
  res.sendStatus(204);
}

module.exports = { fireWebhook };
