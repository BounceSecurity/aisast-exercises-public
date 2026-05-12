// CLEAN. Calls user.toPublicJson() before sending to the partner.

const express = require("express");
const { loadUser } = require("../models/user");
const thirdPartyApi = require("../services/thirdPartyApi");

const router = express.Router();

router.post("/sync", async (req, res) => {
  const user = loadUser(req.body.userId);
  const safe = user.toPublicJson();
  await thirdPartyApi.send("profile_sync", safe);
  res.status(204).end();
});

module.exports = router;
