// BAD: only logs, then charges. No type / range / allowlist checks.
const express = require("express");
const paymentApi = require("../payment-api");

const router = express.Router();

router.post("/topup", async (req, res) => {
  console.log("topup request", req.body);
  const result = await paymentApi.charge(req.body);
  res.json(result);
});

module.exports = router;
