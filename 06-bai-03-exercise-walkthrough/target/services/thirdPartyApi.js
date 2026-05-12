// Wrapper around an outbound HTTP call to an external partner.
// ANYTHING passed to send() leaves our trust boundary.

const axios = require("axios");

async function send(eventName, payload) {
  return axios.post("https://partner.example.com/v1/events", {
    event: eventName,
    payload,
  }, {
    headers: { Authorization: "Bearer " + (process.env.PARTNER_TOKEN || "") },
    timeout: 5000,
  });
}

module.exports = { send };
