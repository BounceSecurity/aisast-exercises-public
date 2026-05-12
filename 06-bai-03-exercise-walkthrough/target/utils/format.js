// Two helpers used by the routes. Only one strips PII.

// Builds a marketing-safe summary. PII is dropped.
function summarizeForMarketing(user) {
  return {
    userId: user.id,
    country: user.country,
    cohortMonth: (user.signupDate || "").slice(0, 7),
  };
}

// Builds a "rich" event used by analytics. Includes everything on
// the user object as-is.
function enrichEvent(user, extra) {
  return {
    user,
    ...extra,
    enrichedAt: new Date().toISOString(),
  };
}

module.exports = { summarizeForMarketing, enrichEvent };
