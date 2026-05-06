const express = require("express");
const cors = require("cors");

const app = express();

// BAD: wildcard origin on a service that issues cookies. The
// `credentials: true` makes browsers refuse this in practice, but
// the *intent* is wrong and many servers strip Origin to bypass.
app.use(cors({ origin: "*", credentials: true }));

app.get("/me", (req, res) => res.json({ ok: true }));

module.exports = app;
