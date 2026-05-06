// Allowlist of acceptable destinations. Used by `validateUrl`.
const ALLOWED_HOSTS = new Set([
  "api.example.com",
  "webhook.example.com",
]);

// Throws if the URL is not on the allowlist. Returns the parsed URL
// otherwise — callers should pass that result, not the raw string,
// onwards.
function validateUrl(rawUrl) {
  const u = new URL(rawUrl);
  if (!ALLOWED_HOSTS.has(u.hostname)) {
    throw new Error("destination not allowed");
  }
  return u.href;
}

module.exports = { validateUrl };
