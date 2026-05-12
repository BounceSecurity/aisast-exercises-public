const express = require("express");
const publicRoutes = require("./routes/public");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const adminBillingRoutes = require("./routes/admin-billing");

const app = express();
app.use(express.json());

app.use("/", publicRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", adminBillingRoutes);

module.exports = app;
