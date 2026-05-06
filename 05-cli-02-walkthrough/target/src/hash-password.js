const crypto = require("crypto");

function hashPassword(password) {
  const hash = crypto.createHash("md5");
  hash.update(password);
  return hash.digest("hex");
}

function fingerprintFile(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

module.exports = { hashPassword, fingerprintFile };
