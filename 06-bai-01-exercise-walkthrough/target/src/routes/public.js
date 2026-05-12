// Public routes — these are intentionally unauthenticated.
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "welcome" });
});

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.post("/login", (req, res) => {
  // ... session setup elsewhere
  res.json({ ok: true });
});

module.exports = router;
