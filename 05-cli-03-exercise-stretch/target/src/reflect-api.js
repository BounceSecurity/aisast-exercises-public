const express = require("express");

const app = express();

// BAD: blind reflection of the request Origin into the response.
// Anyone can be the origin.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

app.get("/profile", (req, res) => res.json({}));

module.exports = app;
