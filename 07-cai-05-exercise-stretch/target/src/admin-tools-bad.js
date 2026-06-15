// BAD: req.body.cmd is read into a local, then execSync is called with it.
// One level of indirection — AI must follow the local variable.
const express = require("express");
const { execSync } = require("child_process");
const router = express.Router();

router.post("/admin/run", (req, res) => {
  const userCmd = req.body.cmd;
  const out = execSync(userCmd).toString();
  res.json({ out });
});

module.exports = router;
