// Auth middleware. Decodes the JWT signed by our auth server and
// populates req.user with the trusted server-side identity.
//
// IMPORTANT: req.user.role is the source of truth for authorisation.
// Anything coming from req.body must be treated as user-controlled.

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = {
      id: claims.sub,
      email: claims.email,
      role: claims.role,         // "user" | "admin" | "billing-admin"
      orgId: claims.orgId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}

module.exports = authMiddleware;
