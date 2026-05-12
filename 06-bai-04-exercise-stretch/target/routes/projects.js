// CLEAN. Stores the *creator's* role on the project record, taken
// from req.user.role (server-side, trusted). The project's
// owner-role is informational, not an authz decision.

const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/", (req, res) => {
  const project = db.createProject({
    id: "p_" + Math.random().toString(36).slice(2, 10),
    name: req.body.name,
    ownerId: req.user.id,
    ownerRole: req.user.role,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(project);
});

module.exports = router;
