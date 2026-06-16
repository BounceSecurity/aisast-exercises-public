# 04-rca-04 (exercise) — A taint rule for reflected XSS

**Goal.** Write a Semgrep **taint-mode** rule that flags reflected/DOM XSS:
untrusted data read from `window.location` that reaches a
`document.write(...)` sink — while correctly *not* flagging values that
pass through a sanitizer first.

This is a pure Semgrep rule-authoring exercise (no AGHAST). It is
**test-driven**: the JavaScript file is annotated with Semgrep's
`// ruleid:` (a finding is expected on the next line) and `// ok:` (no
finding) comments. A rule is correct when every annotation is honoured.

Unlike the template-based exercises, this one ships the **finished rule**
in `04-rca-04-exercise.yml` as a worked reference. Read the `.js` spec and
sketch your own rule first if you want the practice, then study the
reference and run the tests against it to see how the pieces fit.

You'll know you're done when `opengrep --taint-intrafile --test` reports
every expected line matched and zero unexpected matches.

## Step 0 — Look at the files

```
04-rca-04-exercise.yml         ← the rule (the reference answer)
04-rca-04-exercise.js          ← annotated test cases (the spec)
04-rca-04-exercise-sg*.bat     ← run with Semgrep (plain / --test)
04-rca-04-exercise-og*.bat     ← run with opengrep (plain / --test)
```

Open the `.js` file. Each `document.write(...)` is tagged:

- `// ruleid: 04-rca-04-exercise` — the rule **must** fire here (tainted).
- `// ok: 04-rca-04-exercise` — the rule **must not** fire here (safe).

The cases cover the three things a taint rule has to get right: sources,
sinks, and sanitizers.

## Step 1 — The taint model

A `mode: taint` rule has three parts:

- **`pattern-sources`** — where untrusted data originates:
  `window.location.href` / `window.location.search`, plus reads of
  `potentiallyDangerous.$PROP` — *unless* `selfClean()` ran first (note the
  `pattern-not-inside`).
- **`pattern-sinks`** — where tainted data is dangerous:
  `document.write('...' + $QUERY + '...')`.
- **`pattern-sanitizers`** — transforms that make data safe again. Three
  shapes are modelled:
  - `sanitize($VAR)` as a **by-side-effect** sanitizer with
    `focus-metavariable: $VAR` (it cleans the variable in place);
  - `$VAR.sanitizeToString(...)` and `CustomSanitize(...)` as
    **return-value** sanitizers (only the assigned result is clean).

The subtlety the tests probe: a return-value sanitizer called for its side
effect (`CustomSanitize(query)` with the result discarded) does **not**
clean `query`; only `query = CustomSanitize(query)` does. Likewise
`sanitize(query)` cleans `query`, but `sanitize(other)` leaves `query`
tainted.

## Step 2 — Run the tests

Use **opengrep** with intra-file taint — the engine this exercise's
expected results were built against:

```bash
opengrep --taint-intrafile --test --config ./04-rca-04-exercise.yml ./04-rca-04-exercise.js
```

`--test` reads the `// ruleid:` / `// ok:` annotations and checks the
rule's output against them. Green means every tainted line fired and every
sanitized/safe line stayed quiet. Drop `--test` to see the actual findings
instead of the pass/fail summary. The provided `*-og*.bat` runners wrap
these commands.

> **Semgrep vs. opengrep.** The `*-sg*.bat` runners call Semgrep instead.
> The *free* Semgrep engine models intra-file taint slightly differently and
> does **not** propagate taint into a couple of the cross-function parameter
> cases (e.g. `trackSearch2` / `trackSearch4`), so `semgrep --test` reports
> a few "missed lines" against this rule. That's an engine difference, not a
> rule bug. A **logged-in Semgrep** (`semgrep login`, which enables the Pro
> engine) follows those cross-function flows and gives the same green run as
> opengrep — either of those works.

## Discussion

- **Sanitizers are where taint rules earn their keep.** A naive
  source→sink rule with no sanitizers flags every `document.write` and is
  useless. Modelling *how* each sanitizer works — in place vs. by return
  value — is what makes the verdicts match reality.
- **`pattern-not-inside` encodes ordering.** The `potentiallyDangerous`
  source stops being a source once `selfClean()` has run, which is why
  `getSearch4` (clean first) is `ok` while `getSearch3` (clean *after* the
  sink) still fires on its first write.
- Taint propagates through intermediate variables and reassignment for
  free (`trackSearch9`), and re-reading a source after a sanitize re-arms
  the finding (`trackSearch8`).

The complete rule is in `04-rca-04-exercise.yml` — the worked reference for
this exercise. If you sketched your own from the `.js` spec, compare the two
now.
