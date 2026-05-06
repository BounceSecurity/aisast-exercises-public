const crypto = require("crypto");

// This one is fine — sha256 is a strong hash.
function tokenFingerprint(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { tokenFingerprint };
