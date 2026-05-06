const crypto = require("crypto");

// Cache keys aren't security-sensitive, but a static rule that just
// looks at the algorithm name has no way of knowing that. This file
// is here so students can see how their first naive rule
// over-matches and decide whether to refine it.
function cacheKey(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}

module.exports = { cacheKey };
