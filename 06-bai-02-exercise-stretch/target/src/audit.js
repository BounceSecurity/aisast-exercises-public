// Audit log helper. All sensitive operations should call auditLog.write
// with at least { actor, action, target } so we have a tamper-evident
// trail. The real implementation appends to a write-only store; here
// it's a stub for the exercise.

const auditLog = {
  write({ actor, action, target, details }) {
    // In production this would push to an append-only log.
    console.log("[AUDIT]", JSON.stringify({ actor, action, target, details }));
  },
};

module.exports = { auditLog };
