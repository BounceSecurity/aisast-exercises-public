// CLEAN. Refund requires billing-admin or admin — checked via JWT-derived role.

const express = require("express");
const { isBillingAdmin } = require("../utils/roles");
const db = require("../utils/db");

const router = express.Router();

router.post("/refund", (req, res) => {
  if (!isBillingAdmin(req.user)) {
    return res.status(403).json({ error: "billing-admin required" });
  }
  const result = db.refundInvoice(req.body.invoiceId, req.body.amount);
  res.json(result);
});

module.exports = router;
