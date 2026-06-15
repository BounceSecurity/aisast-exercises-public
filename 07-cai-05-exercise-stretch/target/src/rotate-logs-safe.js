// SAFE: execSync called with a hardcoded command. No request data flows in.
const { execSync } = require("child_process");

function rotateLogs() {
  return execSync("logrotate /etc/logrotate.conf").toString();
}

module.exports = { rotateLogs };
