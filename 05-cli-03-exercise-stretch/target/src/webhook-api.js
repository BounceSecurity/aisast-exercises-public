const express = require("express");
const cors = require("cors");

const app = express();

// OK: explicit allowlist. This must NOT be flagged.
app.use(cors({ origin: ["https://app.example.com", "https://admin.example.com"] }));

app.post("/hook", (req, res) => res.sendStatus(204));

module.exports = app;
