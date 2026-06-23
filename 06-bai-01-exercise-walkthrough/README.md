# Exercise 03 (walkthrough) — Your first AI check

**Goal.** Build an AGHAST `repository` check that asks Claude to find
admin routes which are NOT guarded by the `requireAdmin` middleware.

This exercise teaches:
- The shape of an AGHAST `repository` check (no Semgrep involved).
- How to write a markdown prompt — Overview / What to Check / Result.
- Why being concrete ("admin route = path mounted under /admin") beats
  vague language ("look for missing auth").
- Why naming exact file paths in the prompt makes the output actionable.

You'll know you're done when `aghast scan` reports `FAIL` with exactly
two issues: one in `src/routes/admin.js` (the unguarded DELETE) and one
in `src/routes/admin-billing.js` (the unguarded refund POST). The clean
files (`public.js`, `users.js`, the rest of `admin.js`) must NOT be
flagged.

---

## Step 0 — Look at the target

```
target/
  package.json
  src/
    server.js                     ← mounts routers on /, /admin
    middleware/auth.js            ← defines requireAuth, requireAdmin
    routes/
      public.js                   ← public — no auth needed
      users.js                    ← user-facing — uses requireAuth
      admin.js                    ← admin — most routes use requireAdmin
      admin-billing.js            ← admin — most routes use requireAdmin
```

Open `src/server.js`. Two routers are mounted at `/admin`:

```javascript
app.use("/admin", adminRoutes);
app.use("/admin", adminBillingRoutes);
```

That tells us "any route inside `routes/admin.js` or
`routes/admin-billing.js` is admin-only". Now skim those two files. In
each one, *most* routes pass `requireAdmin` as the second argument, but
**one route in each file does not**. Those are the bugs we want Claude
to find.

> Spend 30 seconds spotting them yourself before reading on. Hint: it's
> the destructive verbs — DELETE and POST refund.

## Step 1 — Why use AI for this?

We could write a Semgrep rule that flags any `router.X(...)` call where
`requireAdmin` is missing. But we'd need a second rule to know "this
router is mounted under `/admin`" — Semgrep can't follow the mount-point
in `server.js` to the route definitions in another file.

An LLM, given the whole repo, can read `server.js`, learn that `adminRoutes`
is mounted under `/admin`, follow the import, and then audit the route
definitions. That cross-file reasoning is what `repository` checks are
for.

## Step 2 — The check folder shape

A `repository` check needs three files (no YAML, no Semgrep):

```
solution/
  checks-config.json                                     ← Layer 1: registry
  checks/
    aghast-admin-route-missing-auth/
      aghast-admin-route-missing-auth.json               ← Layer 2: definition
      aghast-admin-route-missing-auth.md                 ← prompt for the AI
```

`checks-config.json` (Layer 1):

```json
{
  "checks": [
    { "id": "aghast-admin-route-missing-auth", "repositories": [], "enabled": true }
  ]
}
```

`aghast-admin-route-missing-auth.json` (Layer 2):

```json
{
  "id": "aghast-admin-route-missing-auth",
  "name": "Admin route missing auth middleware",
  "instructionsFile": "aghast-admin-route-missing-auth.md",
  "severity": "high",
  "confidence": "medium"
}
```

Note what's **not** there: no `checkTarget` field. That's the signal
that this is a `repository` check — AGHAST sends the whole repo to the
AI together with the markdown instructions.

## Step 3 — Write the markdown prompt

The prompt is the core of the check. AGHAST prepends a generic
"return JSON with this schema" wrapper to it, so you only need to
describe the audit task.

The structure we use is **Overview / What to Check / Result**.
Keep it under 30 lines — the AI reads better with a short, concrete
prompt than a long vague one.

`aghast-admin-route-missing-auth.md`:

```markdown
### Admin route missing auth middleware

#### Overview
This is an Express app. Admin routes must be guarded by the `requireAdmin`
middleware (defined in `src/middleware/auth.js`). This check finds admin
routes that are NOT guarded.

#### What to Check
1. In `src/server.js`, identify each path prefix mounted with
   `app.use("/admin", ...)`. Any router mounted under `/admin` is an
   "admin router".
2. For every route handler defined in an admin router (i.e. each
   `router.get/post/put/patch/delete(...)` call), check whether
   `requireAdmin` is passed as a middleware argument before the handler.
3. If `requireAdmin` is missing from the middleware chain of an admin
   route, this is a finding. Report the file path and the HTTP method +
   path.
4. A route is NOT a finding if `requireAdmin` appears in its argument
   list, even if other middleware also appears.
5. Routes that are not mounted under `/admin` (e.g. `src/routes/public.js`,
   `src/routes/users.js`) are out of scope — do NOT flag them.

#### Result
- **PASS**: every admin route includes `requireAdmin` in its middleware chain.
- **FAIL**: one or more admin routes are missing `requireAdmin`.
```

### Why this prompt works

- **Concrete definition.** "Admin route = mounted under `/admin`" is
  a rule the AI can mechanically apply. "Admin route = sensitive
  thing" would let the AI guess, and the guesses won't match yours.
- **Named paths.** Telling the AI exactly which files contain the
  middleware (`src/middleware/auth.js`) and which to ignore
  (`public.js`, `users.js`) cuts false positives. A `repository`
  check is grep-able by the model; help it grep the right places.
- **Negative cases listed.** Item 4 ("not a finding if `requireAdmin`
  appears...") and item 5 ("out of scope") explicitly bound the
  problem. Without these, the AI may flag user-facing routes that
  *also* lack `requireAdmin` (correctly, but irrelevantly).
- **Short.** ~20 lines. Long prompts dilute focus.

## Step 4 — Scan

From inside the exercise folder:

```powershell
aghast scan target --config-dir solution
```

The scan takes 20-90s — the AI is reading the whole target. When it
finishes you should see:

```
Result: FAIL (2 issues)
```

Open `target/security_checks_results.json`. The two issues should
point at:
- `src/routes/admin.js`, around line 18 — the unguarded `DELETE /users/:id`.
- `src/routes/admin-billing.js`, around line 12 — the unguarded `POST /billing/refund`.

Verify that no other file (especially `users.js`, which uses only
`requireAuth`, not `requireAdmin`) appears in the issues.

## Discussion

- **Try a vaguer prompt.** Replace the `What to Check` section with
  "Find admin routes that are not authenticated." Re-run. The AI may
  start flagging non-admin routes too, or invent a different definition
  of "admin". Concreteness is what kept the false positives at zero.
- **Try removing item 5.** Without "routes not mounted under /admin
  are out of scope", the AI sometimes notes that `users.js` lacks
  `requireAdmin` — which is true but irrelevant. Negative cases matter.
- **Cost vs. Semgrep.** Each `repository` scan costs API tokens. Use
  `repository` checks when cross-file reasoning is needed; use Semgrep
  (Exercise 01) when a syntactic match is enough.
