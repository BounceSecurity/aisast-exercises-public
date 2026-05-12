// User-facing routes. These require a logged-in user but not admin.
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/users/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.patch("/users/me", requireAuth, (req, res) => {
  // Update own profile.
  res.json({ ok: true });
});

module.exports = router;
