// SAFE-ish: eval is called with a hardcoded string. Bad practice but no
// attacker influence. Should NOT be flagged as a request-data sink.
function precomputedConstants() {
  return eval("1 + 2 + 3");
}

module.exports = { precomputedConstants };
