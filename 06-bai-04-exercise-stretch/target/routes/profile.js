// RED HERRING. Accepts req.body.role but stores it as a *display
// preference* — it controls which role's UI defaults the user sees,
// not what the server will let them do. validateRole() only
// allow-lists the string. No privileged operation is gated on this
// value anywhere in the codebase.

const express = require("express");
const { validateRole } = require("../utils/roles");
const db = require("../utils/db");

const router = express.Router();

router.put("/preferences", (req, res) => {
  const preferredRoleView = validateRole(req.body.role);
  const prefs = db.savePreference(req.user.id, {
    theme: req.body.theme === "dark" ? "dark" : "light",
    preferredRoleView, // purely a UI hint
  });
  res.json(prefs);
});

module.exports = router;
