// CLEAN. Uses summarizeForMarketing(user) which drops PII.

const express = require("express");
const { loadUser } = require("../models/user");
const { summarizeForMarketing } = require("../utils/format");
const thirdPartyApi = require("../services/thirdPartyApi");

const router = express.Router();

router.post("/signup-complete", async (req, res) => {
  const user = loadUser(req.body.userId);
  const summary = summarizeForMarketing(user);
  await thirdPartyApi.send("signup_complete", summary);
  res.status(204).end();
});

module.exports = router;
