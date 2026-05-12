const express = require("express");
const analytics = require("./routes/analytics");
const marketing = require("./routes/marketing");
const support = require("./routes/support");
const profile = require("./routes/profile");

const app = express();
app.use(express.json());

app.use("/analytics", analytics);
app.use("/marketing", marketing);
app.use("/support", support);
app.use("/profile", profile);

module.exports = app;
