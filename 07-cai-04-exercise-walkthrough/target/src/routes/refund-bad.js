// BAD: takes amount + customerId from req.body and forwards them straight
// to paymentApi.charge with no validation at all.
const express = require("express");
const paymentApi = require("../payment-api");

const router = express.Router();

router.post("/refund", async (req, res) => {
  const result = await paymentApi.charge({
    amount: -req.body.amount,
    currency: req.body.currency,
    customerId: req.body.customerId,
    note: "refund",
  });
  res.json(result);
});

module.exports = router;
