const express = require("express");
const auth = require("./middleware/auth");

const admin = require("./routes/admin");
const billing = require("./routes/billing");
const team = require("./routes/team");
const projects = require("./routes/projects");
const settings = require("./routes/settings");
const profile = require("./routes/profile");

const app = express();
app.use(express.json());
app.use(auth);

app.use("/admin", admin);
app.use("/billing", billing);
app.use("/team", team);
app.use("/projects", projects);
app.use("/settings", settings);
app.use("/profile", profile);

module.exports = app;
