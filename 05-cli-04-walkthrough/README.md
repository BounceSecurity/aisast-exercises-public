# 05-cli-04 (walkthrough) — Complex Semgrep with `taint` mode

> **Note on `mode: join`.** The course brief mentioned join mode as
> the canonical "complex Semgrep" feature. It is, but on Windows
> Semgrep's join engine relies on `socketpair()` which can be
> blocked by the OS — the rule errors out with `Unix_error:
> Permission denied socketpair`. We've therefore built this
> exercise around `mode: taint`, which is portable and arguably
> more useful day-to-day. There's a section at the bottom showing
> what the equivalent join-mode rule would look like.

**Goal.** Build a `static` AGHAST check that flags every SQL
injection — request data flowing into the SQL string of
`db.execute(...)` — and only those. Parameterised queries and
numerically-cast values must NOT be flagged.

This exercise teaches:
- The shape of a Semgrep `taint` rule: sources, sanitizers, sinks.
- How `focus-metavariable` restricts which subexpression the sink
  cares about.
- How the taint engine follows values across function calls within a
  file.
- Why having a sanitiser entry matters even when the underlying
  primitive (`int()`) is "safe" — without it, you over-flag.

You'll know you're done when the scan reports `FAIL` with **exactly
two findings**:
- `app/routes/users.py` — concat through `build_filter_unsafe`.
- `app/routes/reports.py:by-region` — direct concatenation.

And these are NOT flagged:
- `app/routes/products.py` — bound parameters.
- `app/routes/reports.py:by-month` — value cast through `int()`.

---

## Step 0 — Read the codebase

```
target/app/
  __init__.py
  db.py                ← stub `db.execute(sql, params=())`
  routes/
    users.py           ← request value → local helper → SQL  (BAD)
    products.py        ← request value → params tuple  (OK)
    reports.py         ← one BAD path, one OK path     (mixed)
```

The files are tiny. Read each one and predict in advance which
should be flagged. Then we'll write the rule.

## Step 1 — Why a normal `pattern:` rule isn't enough

You could try this:

```yaml
- id: dumb-sqli
  languages: [python]
  severity: ERROR
  pattern: db.execute($X)
```

Run it. Every `db.execute` lights up — including the safe
parameterised one. A simple AST pattern can't tell where `$X`
*came from*. We need a rule that follows the **flow** of values from
a source to a sink.

## Step 2 — Set up taint mode

A taint rule has three sections under one rule definition:
- `pattern-sources` — where untrusted data starts.
- `pattern-sinks` — where it must not end up.
- `pattern-sanitizers` — operations that "wash" the taint.

Create `solution/checks/aghast-flask-sqli-taint/aghast-flask-sqli-taint.yaml`:

```yaml
rules:
  - id: aghast-flask-sqli-taint
    mode: taint
    languages: [python]
    severity: ERROR
    message: Flask request data flows into a SQL string passed to db.execute.

    pattern-sources:
      - pattern-either:
          - pattern: request.args.get(...)
          - pattern: request.form.get(...)
          - pattern: request.values.get(...)
          - pattern: request.json.get(...)
          - pattern: request.json[...]
          - pattern: request.args[...]

    pattern-sinks:
      - pattern: db.execute($SQL, ...)
```

Run it:

```powershell
semgrep --config solution/checks/aghast-flask-sqli-taint/aghast-flask-sqli-taint.yaml target/
```

You should see findings in `users.py`, `reports.py:21`, **and**
`products.py`. The first two are correct. The third is a false
positive — `name` is reaching `db.execute` only as a param, not as
SQL. We'll fix it next.

## Step 3 — Use `focus-metavariable` to narrow the sink

The sink right now matches the *whole* `db.execute(...)` call.
Taint mode then asks: "does any tainted data appear *anywhere* in
this expression?" — and yes, the params tuple has the tainted name,
so it fires.

`focus-metavariable` tells taint mode "only check this
sub-expression". We capture the SQL position into `$SQL` and focus on
it:

```yaml
    pattern-sinks:
      - patterns:
          - pattern: db.execute($SQL, ...)
          - focus-metavariable: $SQL
```

Re-run. `products.py` is gone — taint is no longer interested in
data flowing into the params position.

> Note the structure: `pattern-sinks:` is a list, each entry is an
> object that can have either a single `pattern:` or a `patterns:`
> array (logical AND). `focus-metavariable` lives inside that
> `patterns:` block.

## Step 4 — Add `int()` as a sanitizer

`reports.py:by-month` does `int(request.args.get("month"))`. This
*is* safe — `int()` raises on non-numeric input — but our rule
doesn't know that yet. Add a sanitizer:

```yaml
    pattern-sanitizers:
      - pattern: int(...)
      - pattern: float(...)
```

Now the by-month report is silent and the by-region report still
fires. You should be down to **exactly two findings**.

## Step 5 — Wire it up as an AGHAST check

Same shape as Exercise 01: `static` check, no AI. Create these three files:

`solution/checks-config.json`:

```json
{
  "checks": [
    { "id": "aghast-flask-sqli-taint", "repositories": [], "enabled": true }
  ]
}
```

This is AGHAST's top-level check registry. Each entry has:
- `id` — must match the check's folder name exactly.
- `repositories` — which repos this check applies to; an empty array means all repos.
- `enabled` — set to `false` to disable a check without removing it.

`solution/checks/aghast-flask-sqli-taint/aghast-flask-sqli-taint.json`:

```json
{
  "id": "aghast-flask-sqli-taint",
  "name": "Flask SQL injection (taint flow)",
  "severity": "critical",
  "confidence": "high",
  "checkTarget": {
    "type": "static",
    "discovery": "semgrep",
    "rules": "aghast-flask-sqli-taint.yaml"
  }
}
```

This is the check definition. Key fields:
- `id` / `name` — machine and human-readable identifiers.
- `severity` — how serious a finding is (`critical`, `high`, `medium`, `low`).
- `confidence` — how likely findings are to be real bugs rather than false positives.
- `checkTarget.type: "static"` — Semgrep findings are mapped straight to results; no AI runs.
- `checkTarget.discovery: "semgrep"` — tells AGHAST to run Semgrep for discovery.
- `checkTarget.rules` — path to the Semgrep YAML file, relative to the check folder.

`solution/checks/aghast-flask-sqli-taint/aghast-flask-sqli-taint.yaml` — the YAML you've just built.

Run:

```powershell
aghast scan target --config-dir solution
```

Expected: `FAIL`, 2 issues, in `users.py` and `reports.py`.

## Discussion

- **Cross-function tracking.** Notice that the `users.py` finding
  flows through `build_filter_unsafe`, a helper defined in the same
  file. Taint mode follows values into local helper functions
  automatically (and across files when interfile analysis is on).
  This is why the rule worked even though the unsafe concat happens
  in the helper, not in the route handler itself.
- **False positives from helper return shapes.** Earlier drafts of
  this exercise had a `build_filter_safe` helper that returned a
  `(sql, params)` tuple. Taint mode could not tell which element of
  the tuple the caller used and flagged both. This is a real-world
  gotcha: when designing helpers, make their *interface* a sanitizer
  (return a query object, not a raw string) so static rules can
  recognise safety.
- **The `int()` sanitizer.** If a bad actor passes `"1; DROP TABLE
  --"` to `/reports/by-month`, `int()` raises before the SQL is
  built. So `int()` is a legitimate sanitizer for this sink — but it
  would NOT be safe for an `eval()` or `exec()` sink. Sanitizers are
  always relative to a sink.

## Appendix — the join-mode equivalent

Join mode lets you correlate matches from two separate Semgrep rules
on a shared metavariable. The shape is:

```yaml
rules:
  - id: registered-without-auth
    mode: join
    severity: ERROR
    message: "Handler `$F` is registered but does not call require_role."
    languages: [python]
    join:
      rules:
        - id: route-reg
          languages: [python]
          pattern: |
            app.add_url_rule(..., view_func=$F, ...)
        - id: handler-without-auth
          languages: [python]
          patterns:
            - pattern: |
                def $F(...):
                    ...
            - pattern-not: |
                def $F(...):
                    ...
                    require_role(...)
                    ...
      on:
        - 'route-reg.$F == handler-without-auth.$F'
```

In words: rule A finds places where a handler is wired to a URL, rule
B finds handler definitions that lack `require_role`, the `on:` line
joins them by the function-name metavariable. Where both fire on the
same `$F`, you get a finding.

This works on Linux/macOS Semgrep installs. On Windows the engine
errors out as described at the top of this README, which is why we
went with taint mode for the verifiable solution.
