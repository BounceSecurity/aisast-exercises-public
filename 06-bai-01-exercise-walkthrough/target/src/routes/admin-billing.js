// Admin billing routes — also live under /admin (mounted in server.js).
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const router = express.Router();

// View invoices for any tenant.
router.get("/billing/invoices", requireAdmin, (req, res) => {
  res.json({ invoices: [] });
});

// Issue a refund. NOTE: missing requireAdmin guard.
router.post("/billing/refund", (req, res) => {
  res.json({ ok: true, refunded: req.body.amount });
});

module.exports = router;
