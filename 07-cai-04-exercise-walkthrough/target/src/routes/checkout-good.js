// GOOD: validates amount and currency before calling paymentApi.charge.
const express = require("express");
const paymentApi = require("../payment-api");

const router = express.Router();

const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP"];

router.post("/checkout", async (req, res) => {
  const { amount, currency, customerId } = req.body;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return res.status(400).json({ error: "invalid amount" });
  }
  if (typeof currency !== "string" || !ALLOWED_CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: "invalid currency" });
  }
  if (typeof customerId !== "string" || customerId.length === 0 || customerId.length > 64) {
    return res.status(400).json({ error: "invalid customerId" });
  }

  const result = await paymentApi.charge({ amount, currency, customerId });
  res.json(result);
});

module.exports = router;
