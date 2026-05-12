// User management handlers.
const db = require("../db");
const { auditLog } = require("../audit");

async function deleteUser(req, res) {
  const id = req.params.id;
  await db.deleteUserById(id);
  auditLog.write({
    actor: req.user.id,
    action: "user.delete",
    target: id,
  });
  res.json({ ok: true });
}

async function changeUserRole(req, res) {
  const id = req.params.id;
  const role = req.body.role;
  // No audit logging — bug.
  await db.setUserRole(id, role);
  res.json({ ok: true });
}

async function resetPassword(req, res) {
  const id = req.params.id;
  const newHash = req.body.passwordHash;
  // No audit logging — bug.
  await db.resetUserPassword(id, newHash);
  res.json({ ok: true });
}

async function listUsers(req, res) {
  // Read-only listing, not a sensitive operation.
  const users = await db.listUsers();
  res.json({ users });
}

module.exports = { deleteUser, changeUserRole, resetPassword, listUsers };
