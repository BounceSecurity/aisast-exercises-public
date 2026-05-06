# 05-cli-02 (walkthrough) — Your first Semgrep rule in AGHAST

**Goal.** Build an AGHAST `static` check that flags every use of a
weak hash algorithm (`md5` or `sha1`) in the target codebase.

This exercise teaches:
- The shape of an AGHAST check folder.
- The simplest Semgrep `pattern` and how a metavariable works.
- How to constrain a metavariable with `metavariable-regex`.
- How to wire the rule into a `static` check and run it.

You'll know you're done when `aghast scan` reports two findings:
one in `src/hash-password.js` (md5), one in the same file (sha1),
and **does not** flag the strong hash in `src/token.js`.

> The cache-key file (`src/cache-key.js`) is intentionally a grey area
> — discuss with your trainer whether you'd suppress it or leave it
> as a true positive.

---

## Step 0 — Look at the target

```
target/
  package.json
  src/
    hash-password.js   ← md5 + sha1 (BAD)
    token.js           ← sha256    (OK)
    cache-key.js       ← md5 used as a non-security cache key
```

Open the three files. Note that `hash-password.js` calls
`crypto.createHash("md5")` and `crypto.createHash("sha1")`, while
`token.js` uses `crypto.createHash("sha256")`. Our rule needs to flag
the first two and ignore the third.

## Step 1 — Sanity-check Semgrep with a literal pattern

Before writing a rule file, prove that Semgrep can find the call. From
the `target/` directory:

```powershell
semgrep --lang js --pattern 'crypto.createHash("md5")' src/
```

You should see one match in `hash-password.js` and one in
`cache-key.js`. Good — Semgrep can see the AST.

## Step 2 — Generalise with a metavariable

We don't want to write one rule for `md5` and another for `sha1`. A
metavariable (`$NAME`, written in capitals) lets the pattern match any
expression in that position:

```powershell
semgrep --lang js --pattern 'crypto.createHash($ALGO)' src/
```

Now you'll match three calls — including the safe `sha256`. We'll
filter that out next.

## Step 3 — Constrain `$ALGO` with `metavariable-regex`

Patterns combined with constraints have to live in a YAML rule file.
Create `solution/checks/aghast-weak-hash/aghast-weak-hash.yaml`:

```yaml
rules:
  - id: aghast-weak-hash
    languages: [javascript, typescript]
    severity: ERROR
    message: >
      `crypto.createHash` called with the broken algorithm `$ALGO`.
    patterns:
      - pattern: crypto.createHash($ALGO)
      - metavariable-regex:
          metavariable: $ALGO
          regex: ^["'](?i)(md5|sha1)["']$
```

Notes:
- The regex matches the **literal source** of `$ALGO` — that's why we
  include the quotes and the `(?i)` for case-insensitivity.
- `patterns:` (plural) ANDs its children. Every child must match.

Run it:

```powershell
semgrep --config solution/checks/aghast-weak-hash/aghast-weak-hash.yaml src/
```

You should see exactly two findings — both in `hash-password.js`. The
sha256 in `token.js` is filtered out by the regex.

## Step 4 — Wrap the rule as an AGHAST check

A check folder needs three files (when there's no AI involved):

```
solution/
  checks-config.json                        ← which checks exist (Layer 1)
  checks/
    aghast-weak-hash/
      aghast-weak-hash.json                 ← check definition (Layer 2)
      aghast-weak-hash.yaml                 ← Semgrep rule
```

`checks-config.json`:

```json
{
  "checks": [
    { "id": "aghast-weak-hash", "repositories": [], "enabled": true }
  ]
}
```

This is AGHAST's top-level check registry. Each entry has:
- `id` — must match the check's folder name exactly.
- `repositories` — which repos this check applies to; an empty array means all repos.
- `enabled` — set to `false` to disable a check without removing it.

`aghast-weak-hash.json`:

```json
{
  "id": "aghast-weak-hash",
  "name": "Weak hash algorithm",
  "severity": "high",
  "confidence": "high",
  "checkTarget": {
    "type": "static",
    "discovery": "semgrep",
    "rules": "aghast-weak-hash.yaml"
  }
}
```

This is the check definition. Key fields:
- `id` / `name` — machine and human-readable identifiers.
- `severity` — how serious a finding is (`critical`, `high`, `medium`, `low`).
- `confidence` — how likely findings are to be real bugs rather than false positives.
- `checkTarget.type: "static"` — Semgrep findings are mapped straight to results; no AI runs. This makes the check deterministic and free.
- `checkTarget.discovery: "semgrep"` — tells AGHAST to run Semgrep for discovery.
- `checkTarget.rules` — path to the Semgrep YAML file, relative to the check folder.

## Step 5 — Scan

From the exercise directory:

```powershell
aghast scan target --config-dir solution
```

Expected output: status `FAIL`, with two issues — both pointing at
`src/hash-password.js`. Open the JSON report (default
`security_checks_results.json` in the target dir) to confirm.

## Discussion

- Try removing the `metavariable-regex` block. The rule now flags
  `sha256` in `token.js` — a false positive. Static rules over-match
  by default; constraints are how you tighten them.
- The `cache-key.js` finding is a true positive *syntactically* — md5
  is being used. Whether it's a *real* bug is context. If you wanted
  to suppress just that line, add a `// nosemgrep:` comment above it.
- For a sterner "this is a password hash" rule you'd add a
  `pattern-inside` or `pattern-either` to also match `bcrypt.hash` /
  `argon2.hash` call sites — see the advanced exercise for that
  flavour.
