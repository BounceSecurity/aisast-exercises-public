# Exercise 03 (advanced) — Sensitive operations missing audit logging

**Goal.** Build an AGHAST `repository` check that asks Claude to find
sensitive HTTP handlers which mutate state but do NOT call
`auditLog.write({...})`.

This is the same shape as the walkthrough — a `repository` check with
just `checks-config.json`, an `<id>.json` definition, and an `<id>.md`
prompt — but you write the prompt yourself. No Semgrep, no AI tooling
beyond what AGHAST already does.

## The target

`target/` is a tiny Express app with two route handler files:

- `src/handlers/users.js` — `deleteUser`, `changeUserRole`, `resetPassword`,
  `listUsers`.
- `src/handlers/funds.js` — `transferFunds`, `refund`, `getBalance`.

Some handlers call `auditLog.write({...})` (the helper from
`src/audit.js`). Some don't. Some are read-only and shouldn't be
flagged either way.

You are not required to read the target before writing the prompt — but
do skim `src/audit.js` to know what an audit call looks like.

Key information:

- Sensitive db operations (which mutate state) include: `deleteUserById`, `setUserRole`, `resetUserPassword`, `transferFunds` in the `db` module.
- Read-only handlers operations (which do not need logging in this use case) are: `listUsers`, `getBalance`.

Handlers including mutations need to call `auditLog.write({...})` (from `src/audit.js`) to perform the logging.

## Constraints

- The check must be of type `repository` (no `checkTarget` field in
  the JSON).
- Your markdown prompt must be **under 30 lines**. Concise prompts
  give better signal than long ones.
- Your prompt should follow the **Overview / What to Check / Result**
  structure.
- The check must produce **zero false positives** on read-only
  handlers (`listUsers`, `getBalance`).

## Hints

- The walkthrough's prompt is your model. Re-read it if you're stuck.
- "Sensitive" is vague. Define it concretely. Example shape: "a handler
  is sensitive if it calls one of these specific db functions: ...".
  Listing the function names beats describing them in prose.
- Tell the AI which directories to look at. Without that hint, models
  sometimes scan utility files and fabricate handlers.
- Tell the AI which handlers to **ignore** (read-only ones) — negative
  cases are as important as positive ones for keeping false positives
  out.

## Done when...

Running, from inside the exercise folder:

```powershell
aghast scan target --config-dir <your-solution-dir>
```
If you set your AI provider in the runtime-config.json file you need to add `--runtime-config <path-to-runtime-config.json>` to your command.

...reports `FAIL` with **exactly three issues**, one for each of:

- `changeUserRole` in `src/handlers/users.js`
- `resetPassword` in `src/handlers/users.js`
- `refund` in `src/handlers/funds.js`

And the four clean handlers (`deleteUser`, `listUsers`, `transferFunds`,
`getBalance`) must NOT appear in the issues list.

If the AI flags a clean handler, your prompt is too loose — tighten the
"sensitive operation" definition or list the read-only handlers as
out-of-scope. If the AI misses a buggy one, your prompt is too narrow —
broaden the list of db functions that count as sensitive mutations.
Iterate.
