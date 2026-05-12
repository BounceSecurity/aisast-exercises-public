// CLEAN. Authorisation gated on req.user.role from the JWT.

const express = require("express");
const { isAdmin } = require("../utils/roles");
const db = require("../utils/db");

const router = express.Router();

router.delete("/users/:id", (req, res) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: "admin required" });
  }
  const result = db.deleteUser(req.params.id);
  res.json(result);
});

module.exports = router;
