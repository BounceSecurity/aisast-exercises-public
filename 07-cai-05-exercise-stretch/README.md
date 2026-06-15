# Exercise 05 (advanced) — Tainted dangerous sinks (goal-only)

> Advanced exercises are **goal-only**. No walkthrough.

## Goal

Build an AGHAST `targeted` check that flags every call to a dangerous
code-execution sink — `eval`, `child_process.exec`, `child_process.execSync`,
`vm.runInContext` — **where the argument is influenced by request data**.

The Semgrep rule should find every call site (high recall). The AI is
invoked once per match and decides whether the argument is
attacker-influenced.

## Constraints

- Use `checkTarget.type: targeted` with `discovery: semgrep`.
- Keep your AI prompt under 40 lines and use the default
  `analysisMode` (custom — your own markdown).
- Write the YAML rule with `pattern-either:` listing each sink
  separately. (You'll trip over the YAML colon trap if you try to
  inline object literals — use `pattern: |` block scalars when needed.)
- The rule should NOT try to detect `req.*` itself — let the AI do
  that. A `pattern-either` over the four sink names is enough.

## Hints

- Hardcoded literal arguments (`eval("1+1")`,
  `execSync("logrotate /etc/logrotate.conf")`) must NOT be flagged.
- Decoding is not sanitization. `JSON.parse(Buffer.from(req.body.blob,
  "base64").toString())` is still attacker-controlled.
- A local variable holding `req.body.X` is still tainted — make sure
  your prompt tells the AI to trace one level of indirection.
- Run from the repo root with absolute paths; the scan takes 1–3
  minutes (one AI call per match).

## Done when…

`aghast scan` reports `FAIL`, with issues at exactly these sinks:

- `src/calculator-bad.js` — `eval(req.body.formula)`
- `src/backup-bad.js` — `exec("tar ... " + req.query.dir)`
- `src/import-bad.js` — `vm.runInContext(payload.script, ctx)` (after
  base64-decode + JSON.parse of `req.body.blob`)
- `src/admin-tools-bad.js` — `execSync(userCmd)` where `userCmd =
  req.body.cmd`

…and zero issues for `src/safe-eval-formula.js`,
`src/rotate-logs-safe.js`, `src/sandbox-safe.js`.

## Sample solution

If you get stuck, look at `solution/`. Wipe it before you start if you
want a clean slate.
