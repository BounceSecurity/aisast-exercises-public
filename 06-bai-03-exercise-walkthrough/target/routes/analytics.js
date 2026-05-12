// BAD. Calls enrichEvent(user, ...) which embeds the raw user
// object — PII included — and forwards it to the partner.

const express = require("express");
const { loadUser } = require("../models/user");
const { enrichEvent } = require("../utils/format");
const thirdPartyApi = require("../services/thirdPartyApi");

const router = express.Router();

router.post("/page-view", async (req, res) => {
  const user = loadUser(req.body.userId);
  const event = enrichEvent(user, { page: req.body.page });
  await thirdPartyApi.send("page_view", event);
  res.status(204).end();
});

module.exports = router;
