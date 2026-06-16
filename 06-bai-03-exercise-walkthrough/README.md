# Exercise 04 (walkthrough) — Cross-file reasoning with AI

**Goal.** Build an AGHAST `repository` check that uses Claude to find
PII leaks where a route handler forwards a `User` record (still
containing `email`, `ssn`, `dateOfBirth`, `phoneNumber`) to an
external partner API. The bug spans **multiple files** — the model is
in one file, the helper that drops PII is in another, and the route
that misuses both is in a third.

This exercise teaches:
- When a `repository` check is the right tool — and when Semgrep would
  be cheaper.
- How to write a markdown prompt that points the AI at sinks, sensitive
  fields, and safe vs unsafe transforms.
- How to ask the AI for actionable output (file path + line number).
- The trade-off between an exhaustive prompt and a focused one.

You'll know you're done when `aghast scan` reports `FAIL` with two
issues — one in `routes/support.js` (raw user) and one in
`routes/analytics.js` (via `enrichEvent`) — and **does not** flag
`routes/marketing.js` or `routes/profile.js`.

---

## Step 0 — Look at the target

```
target/
  server.js
  models/
    user.js                ← defines User + loadUser; toPublicJson() drops PII
  services/
    thirdPartyApi.js       ← THE SINK. send(name, payload) → external HTTP
  utils/
    format.js              ← summarizeForMarketing (safe), enrichEvent (UNSAFE)
  routes/
    profile.js             ← OK (calls user.toPublicJson())
    marketing.js           ← OK (calls summarizeForMarketing)
    support.js             ← BAD (sends raw user object)
    analytics.js           ← BAD (sends enrichEvent(user, ...) — keeps user)
```

Open the files. Notice that no single file is "obviously wrong".
`support.js` looks fine until you remember what `user` actually
contains. `analytics.js` is even more subtle: `enrichEvent` sounds
like it might sanitise, but the body of `enrichEvent` in
`utils/format.js` just spreads the user object unchanged.

## Step 1 — Why not Semgrep?

Try to write the rule in your head. You'd need to match every
`thirdPartyApi.send($EVENT, $PAYLOAD)` and *then* prove that
`$PAYLOAD` either:
- is the user object directly, or
- transitively contains `user.email`, `user.ssn`, etc.

You can roughly approximate this with a `metavariable-pattern` and
some allowlisting of known-safe transforms — but you need a list of
those transforms (`toPublicJson`, `summarizeForMarketing`), and as
soon as someone writes a new helper, your rule is wrong. AI lets us
state the **intent** ("PII fields are these four; safe transforms drop
them; flag every payload that still has any") and lets the model do
the cross-file tracing for us.

## Step 2 — Sketch the prompt

Open `solution/checks/aghast-pii-leak/aghast-pii-leak.md`. Notice
the structure:

1. **Sink.** Name the function. Give the file. Tell the AI which
   argument is the data leaving the trust boundary.
2. **Sensitive fields.** List them by name. Also list the *non*-PII
   fields so the AI doesn't over-flag (e.g. `country` is fine).
3. **Safe transforms.** Name `toPublicJson()` and
   `summarizeForMarketing()`. If the model sees one of these
   between the user object and the sink, it should NOT flag.
4. **Unsafe transforms.** Call out `enrichEvent` explicitly — this
   is the analytics.js trap. (You could leave it out and ask the
   AI to figure it out, but being explicit gives you a far more
   reliable check.)
5. **Output format.** "Include the file path and line number of the
   sink call." Reports without locations are useless to triage.

## Step 3 — The trade-off

There's a temptation to write a 200-line prompt that enumerates
every route, every helper, every variant. Don't. Two reasons:

- Long prompts are expensive (tokens) and slow.
- The AI starts treating the prompt as a checklist instead of doing
  fresh analysis. You lose the "AI noticed something we didn't think
  to ask about" upside.

Aim for: definitions of sink + sensitive fields + safe set, then
"trace each call site". ~30 lines of markdown is plenty for this kind
of check.

## Step 4 — Wrap it as an AGHAST check

Three files (no YAML — there's no Semgrep here):

```
solution/
  checks-config.json
  checks/
    aghast-pii-leak/
      aghast-pii-leak.json     ← Layer 2 definition
      aghast-pii-leak.md       ← prompt for the AI
```

`checks-config.json`:

```json
{
  "checks": [
    { "id": "aghast-pii-leak", "repositories": [], "enabled": true }
  ]
}
```

`aghast-pii-leak.json`:

```json
{
  "id": "aghast-pii-leak",
  "name": "PII leak to external partner",
  "instructionsFile": "aghast-pii-leak.md",
  "severity": "high",
  "confidence": "medium"
}
```

No `checkTarget` field — the default is a `repository` check, which
sends the whole repo to the AI plus the markdown above.

## Step 5 — Scan

From inside the exercise folder (`ANTHROPIC_API_KEY` must be set):

```powershell
aghast scan target --config-dir solution
```

Expect: status `FAIL`, exactly two issues, both in the `routes/`
folder — `support.js` (raw user) and `analytics.js` (via
`enrichEvent`). The scan takes 30–120 seconds.

## Discussion

- **Try removing the "Unsafe transforms" bullet** about `enrichEvent`.
  The AI will usually still find the support.js leak, but the
  analytics.js one becomes hit-and-miss — sometimes flagged,
  sometimes not. That's the cross-file reasoning the prompt is paying
  for.
- **Try renaming `enrichEvent` to `formatEvent`.** A pure-pattern rule
  would silently miss it. The AI reads the *body* of the function and
  sees that it spreads `user`, so it still flags. That's the value
  proposition.
- **Output discipline.** If the AI returns findings without file
  paths and line numbers, your check is unusable in CI. The prompt's
  "Output" section is non-negotiable.
- **Cost vs Semgrep.** This check costs real money per scan. Run it
  on PRs where files in `routes/` or `services/` change, not on every
  commit.

## Sample solution

Already in `solution/`. Copy `solution/` somewhere else if you'd like
a clean slate to write the prompt yourself.
