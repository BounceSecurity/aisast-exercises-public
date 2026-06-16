# Exercise 04 (advanced) — Privilege escalation across files

**Goal.** Build an AGHAST `repository` check that uses Claude to find
handlers where a privileged decision is gated on a value the client
controls (`req.body.role`, `req.body.isAdmin`, etc.) instead of on
the server-side identity (`req.user.role`, populated from a verified
JWT). The bug is *contextual*: the same field name (`req.body.role`)
appears in both vulnerable and benign handlers — only the AI's
cross-file reasoning can tell them apart.

## Constraints

- One AGHAST check, type `repository` (no `checkTarget`).
- Markdown prompt must be **under 40 lines**.
- Do not modify any file under `target/`. The bugs are already there.
- The prompt must teach the AI:
  - Which sources of `role`/privilege are **trusted** vs
    **untrusted** in this codebase.
  - That writing an untrusted role into a *security-relevant* record
    (e.g. another user's privilege) counts, but writing it into a
    *cosmetic* record (e.g. a UI preference) does not.
  - To return file path + line number for every finding.

## Hints

- Read `middleware/auth.js` first — it tells you where the trusted
  role lives (`req.user.role`).
- There are six routes. Three are clean. Two are real bugs. One is
  a red herring. Don't peek at the solution prompt before deciding
  which is which.
- A purely pattern-matching rule would either flag every
  `req.body.role` (false positives on the red herring) or none
  (false negatives on the real bug). The whole point of using AI
  here is "is this role being used for an authz decision?", which
  needs context.
- Be specific in your prompt. The walkthrough's prompt is a good
  template — sink, trusted source, untrusted source, what counts,
  what doesn't.

## Done when…

Running, from inside the exercise folder:

```powershell
aghast scan target --config-dir solution
```

reports **status `FAIL`** with issues in **`routes/team.js`** AND
**`routes/settings.js`** — and does NOT flag `routes/admin.js`,
`routes/billing.js`, `routes/projects.js`, or `routes/profile.js`.

If the AI flags the profile route, your prompt isn't strict enough
about "stored as a UI preference doesn't count". If it misses the
settings route, you probably forgot to call out
`req.body.isAdmin`-style boolean privilege flags.

## Discussion points (for after you've passed)

- The check is non-deterministic. Run it twice and you may see
  slightly different wording, possibly different secondary findings.
  How would you stabilise this for CI?
- The red herring is "real" code — apps store UI preferences all the
  time. How would you change `routes/profile.js` so that a too-eager
  prompt could no longer be tricked into flagging it? (Hint:
  rename the field.)
- This check overlaps with the Semgrep "look for `req.body.role`"
  rule. When would you use one vs the other? Could you chain them
  (Semgrep finds candidates, AI validates) using a `targeted` check?
  That's exactly Exercise 05.

## Sample solution

A working markdown prompt + check definition is in `solution/`. Try
your own first; compare afterwards.
