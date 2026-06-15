// BAD: req.body.formula flows directly into eval().
const express = require("express");
const router = express.Router();

router.post("/calc", (req, res) => {
  const result = eval(req.body.formula);
  res.json({ result });
});

module.exports = router;
