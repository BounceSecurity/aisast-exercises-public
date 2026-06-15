// SAFE: vm.runInContext called with a hardcoded snippet stored in a const.
const vm = require("vm");

const STARTUP_SNIPPET = "globalThis.READY = true;";

function bootSandbox() {
  const ctx = vm.createContext({});
  vm.runInContext(STARTUP_SNIPPET, ctx);
  return ctx;
}

module.exports = { bootSandbox };
