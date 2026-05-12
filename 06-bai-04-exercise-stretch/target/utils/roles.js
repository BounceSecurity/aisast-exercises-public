// Role helpers.

const VALID_ROLES = ["user", "admin", "billing-admin", "viewer", "editor"];

// Validates that a role string is one of the allowed values. Used
// when storing a *preference* — does NOT grant the privilege.
function validateRole(role) {
  if (typeof role !== "string") return null;
  return VALID_ROLES.includes(role) ? role : null;
}

function isAdmin(user) {
  return user && user.role === "admin";
}

function isBillingAdmin(user) {
  return user && (user.role === "admin" || user.role === "billing-admin");
}

module.exports = { VALID_ROLES, validateRole, isAdmin, isBillingAdmin };
