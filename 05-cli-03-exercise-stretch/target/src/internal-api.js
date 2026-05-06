const express = require("express");
const cors = require("cors");

const app = express();

// OK: function-based origin check. This must NOT be flagged.
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin.endsWith(".example.com")) return cb(null, true);
    return cb(new Error("not allowed"));
  },
}));

module.exports = app;
