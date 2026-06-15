// Stub: pretend external HTTP client. Treat all calls to charge() as
// expensive / sensitive — they hit a real third-party billing system.
module.exports = {
  charge: async function (params) {
    return { ok: true, params };
  },
};
