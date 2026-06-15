// GOOD: validates plan against an allowlist, customerId shape, then charges
// a fixed amount derived from the (validated) plan.
const express = require("express");
const paymentApi = require("../payment-api");

const router = express.Router();

const PLAN_PRICES = { basic: 999, pro: 2999, enterprise: 9999 };

router.post("/subscribe", async (req, res) => {
  const { plan, customerId } = req.body;

  if (typeof plan !== "string" || !Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
    return res.status(400).json({ error: "invalid plan" });
  }
  if (typeof customerId !== "string" || !/^cus_[A-Za-z0-9]{6,32}$/.test(customerId)) {
    return res.status(400).json({ error: "invalid customerId" });
  }

  const amount = PLAN_PRICES[plan];
  const result = await paymentApi.charge({ amount, currency: "USD", customerId, plan });
  res.json(result);
});

module.exports = router;
