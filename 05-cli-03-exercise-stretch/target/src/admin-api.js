const express = require("express");
const cors = require("cors");

const app = express();

// BAD: cors() with no options defaults to Access-Control-Allow-Origin: *
app.use(cors());

app.get("/admin/users", (req, res) => res.json([]));

module.exports = app;
