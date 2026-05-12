const express = require("express");
const users = require("./handlers/users");
const funds = require("./handlers/funds");

const app = express();
app.use(express.json());

// User management.
app.delete("/users/:id", users.deleteUser);
app.post("/users/:id/role", users.changeUserRole);
app.post("/users/:id/password-reset", users.resetPassword);
app.get("/users", users.listUsers);

// Funds.
app.post("/funds/transfer", funds.transferFunds);
app.post("/funds/refund", funds.refund);
app.get("/funds/:id/balance", funds.getBalance);

module.exports = app;
