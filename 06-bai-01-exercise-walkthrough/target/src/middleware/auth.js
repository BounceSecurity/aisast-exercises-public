// Authentication and authorization middleware.
// Both functions look at req.user, which is populated by an upstream
// session middleware (not shown). Routes that need to be admin-only
// should be guarded by requireAdmin (which implies requireAuth).

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "not authenticated" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "admin only" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
