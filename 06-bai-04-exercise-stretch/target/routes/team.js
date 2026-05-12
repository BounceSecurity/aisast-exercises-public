// BAD. POST /team/members lets ANY authenticated user add a team
// member, and the role of the new member comes straight from the
// request body. Without a server-side role check, a regular "user"
// can add a new "admin" member to their org.

const express = require("express");
const { validateRole } = require("../utils/roles");
const db = require("../utils/db");

const router = express.Router();

router.post("/members", (req, res) => {
  const role = validateRole(req.body.role);
  if (!role) return res.status(400).json({ error: "invalid role" });

  const member = db.saveMember(req.user.orgId, {
    email: req.body.email,
    role: role,
    addedBy: req.user.id,
  });
  res.status(201).json(member);
});

module.exports = router;
