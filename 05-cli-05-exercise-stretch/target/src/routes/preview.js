// BAD: parses the URL "to validate it" but doesn't actually
// allowlist anything. Parsing is not validation.
async function previewLink(req, res) {
  const raw = req.body.url;
  const parsed = new URL(raw); // looks defensive, isn't
  const r = await fetch(parsed.href);
  const text = await r.text();
  res.send(text);
}

module.exports = { previewLink };
