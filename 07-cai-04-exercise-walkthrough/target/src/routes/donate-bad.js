// BAD: parseFloat does NOT count as validation — NaN / Infinity / negative
// values flow through. No customer or currency check either.
const express = require("express");
const paymentApi = require("../payment-api");

const router = express.Router();

router.post("/donate", async (req, res) => {
  const amount = parseFloat(req.body.amount);
  const result = await paymentApi.charge({
    amount,
    currency: req.body.currency,
    customerId: req.body.customerId,
  });
  res.json(result);
});

module.exports = router;
