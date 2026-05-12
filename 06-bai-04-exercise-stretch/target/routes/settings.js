// BAD. The "danger zone" toggle uses req.body.isAdmin to decide
// whether to allow workspace deletion. A regular user can simply
// POST { isAdmin: true } and bypass the gate.

const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/danger-zone/delete-workspace", (req, res) => {
  if (!req.body.isAdmin) {
    return res.status(403).json({ error: "admin required" });
  }
  // Pretend this nukes the workspace.
  res.json({ ok: true, deletedWorkspace: req.user.orgId });
});

module.exports = router;
