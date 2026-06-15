// BAD (tricky): the request body is base64-decoded and JSON-parsed, then a
// field of the parsed object is passed to vm.runInContext. The AI must
// trace `payload` back to req.body to see this is attacker-controlled.
const express = require("express");
const vm = require("vm");
const router = express.Router();

router.post("/import", (req, res) => {
  const raw = Buffer.from(req.body.blob, "base64").toString("utf8");
  const payload = JSON.parse(raw);
  const ctx = vm.createContext({ result: null });
  vm.runInContext(payload.script, ctx);
  res.json({ result: ctx.result });
});

module.exports = router;
