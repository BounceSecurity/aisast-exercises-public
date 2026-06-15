// BAD: req.query.dir flows into child_process.exec via string concatenation.
const express = require("express");
const { exec } = require("child_process");
const router = express.Router();

router.get("/backup", (req, res) => {
  exec("tar -czf /tmp/backup.tgz " + req.query.dir, (err, stdout) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ stdout });
  });
});

module.exports = router;
