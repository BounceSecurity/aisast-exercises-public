// Admin routes — every route here MUST be guarded by requireAdmin.
// These all live under the /admin path prefix (see server.js).
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const router = express.Router();

// List all users.
router.get("/users", requireAdmin, (req, res) => {
  res.json({ users: [] });
});

// Promote a user to admin.
router.post("/users/:id/promote", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// Delete a user. NOTE: missing requireAdmin guard.
router.delete("/users/:id", (req, res) => {
  res.json({ ok: true, deleted: req.params.id });
});

// Inspect server config.
router.get("/config", requireAdmin, (req, res) => {
  res.json({ config: {} });
});

module.exports = router;
