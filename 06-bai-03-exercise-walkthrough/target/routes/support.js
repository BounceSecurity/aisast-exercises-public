// BAD. Sends the raw user object — including email, ssn, dateOfBirth
// and phoneNumber — to the third-party partner.

const express = require("express");
const { loadUser } = require("../models/user");
const thirdPartyApi = require("../services/thirdPartyApi");

const router = express.Router();

router.post("/ticket-opened", async (req, res) => {
  const user = loadUser(req.body.userId);
  // Forwarding the full user record so support tooling has context.
  await thirdPartyApi.send("ticket_opened", user);
  res.status(204).end();
});

module.exports = router;
