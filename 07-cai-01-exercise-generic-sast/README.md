# 07-cai-01 (exercise) — Triage a raw SARIF report with AI

**Goal.** A generic SAST tool (Semgrep, `--config auto`) has already been
run against a banking web app and produced a raw SARIF report full of
findings — some real, many noise. Your job is **not** to find bugs. It is
to write an AGHAST `targeted` check that feeds every finding in that
report to the AI and asks one question per finding: **is this a true
positive or a false positive?**

This is the **false-positive-validation** pattern: AGHAST has a built-in
analysis mode that takes an external SARIF file, turns each finding into
one target, and runs a triage prompt against the surrounding code. You
supply no Semgrep rule and no AI prompt of your own — the SARIF is the
input and the built-in mode is the prompt.

You'll know you're done when `aghast scan` runs to completion, reports a
target for **every** finding in the report, and returns a confirmed /
false-positive verdict (with reasoning) for each one. Judging whether the
AI's verdicts are *correct* is the final part of the exercise.

---

## Step 0 — Look at the target

The codebase and its SARIF report live in a **separate** folder from this
exercise:

```
../big-code-base/                 ← the target you scan
  src/                            ← Next.js banking app (TypeScript)
  semgrep.sarif                   ← raw Semgrep findings to triage  ← INPUT
  semgrep.txt / semgrep.html      ← same findings, human-readable
  context.md                      ← trust-model notes for the validator
  run-semgrep-auto.ps1 / .sh      ← how the SARIF was generated

07-cai-01-exercise-generic-sast/  ← this folder
  solution/                       ← reference config-dir (your answer goes here)
```

Open `../big-code-base/semgrep.txt` (or `.html`) first — that's the report
in human-readable form. Then skim `../big-code-base/context.md`: it
describes the app's trust model (where untrusted input enters, and the
caveat that the JWT-derived "current user" id is **not** a trustworthy
integer). That file is the orientation the AI validator needs.

> The target is its own git repository. AGHAST needs that for repo
> metadata. If you ever copy it somewhere without a `.git/`, re-init it
> (see the top-level `../README.md`).

## Step 1 — What you're building

A single `targeted` check, with **SARIF discovery** and the built-in
**`false-positive-validation`** analysis mode. The mechanics — check
types, the two-layer config (`checks-config.json` + `checks/<id>/<id>.json`),
the `checkTarget` fields, and the analysis modes — are all documented.
**Read these before writing anything:**

- AGHAST docs → **Configuration Reference**: the *SARIF discovery* example
  and the *Analysis modes* row (`false-positive-validation`).
- AGHAST docs → **Creating Checks**: what a check folder contains and how
  `aghast new-check` scaffolds one.

The check needs only:

1. A Layer 1 registry (`checks-config.json`) that enables your check.
2. A Layer 2 definition (`checks/<id>/<id>.json`) with
   `checkTarget.type: "targeted"`, `discovery: "sarif"`,
   `analysisMode: "false-positive-validation"`, and a `sarifFile`.

No `.yaml` rule (that's Semgrep discovery) and no triage prompt of your
own — the built-in mode supplies that. You *do* point the check at a
context file, though; that's Step 2.

## Step 2 — Give the validator context

The most important input after the SARIF itself is
`../big-code-base/context.md`. It is **not** documentation for you — it is
instructions for the AI validator. It states the app's trust model: where
untrusted input enters, and the key trap that the JWT-derived "current
user" id is **not** a trustworthy integer.

Wire it into your check with the `instructionsFile` field. The built-in
`false-positive-validation` mode appends it to its own triage prompt. The
mode runs without it, but several findings — the path traversals
especially — only get triaged correctly when the validator has this trust
model in front of it. **Treat supplying the context as part of the task,
not an optional extra.** (The exact path is the second half of the next
step.)

## Step 3 — The two paths that trip everyone up

The findings about path *resolution* are the whole skill in this exercise.
They are resolved against **different** base directories:

| Field | Resolved relative to | Why |
|---|---|---|
| `checkTarget.sarifFile` | the **target repo** you scan | the SARIF ships *with* the code, not the config |
| `instructionsFile` | the **check folder** (inside the config-dir) | it's part of your check definition |

So in the solution:

- `sarifFile` is `"./semgrep.sarif"` — relative to `../big-code-base`, the
  thing you point `aghast scan` at. It is **not** relative to the solution
  folder.
- `instructionsFile` points at the target's `context.md`. Because that
  file now lives with the codebase (not in the check folder), the path
  walks back out of the config-dir:
  `"../../../../big-code-base/context.md"`. (Why this file matters is
  Step 2.)

Get those two wrong and you'll see `0 targets` or a "file not found"
error. Get them right and the scan discovers one target per finding.

## Step 4 — Configure your model and run

This check **always calls the AI** — one call per finding — so it needs a
provider and a model. **Configure your own** in the shared
`../runtime-config.json`: set `agentProvider.name` and
`agentProvider.model` to whatever you have access to (e.g. an Anthropic
model with `ANTHROPIC_API_KEY` set, a local Claude, or an OpenCode
provider). The AGHAST docs → **Configuration Reference** has the full
runtime-config schema.

Then run from inside the `07-cai-01-exercise-generic-sast` folder, pointing
the scan at the shared `big-code-base`, `--config-dir` at your solution, and
`--runtime-config` at the file you just edited:

```powershell
aghast scan ../big-code-base `
  --config-dir solution `
  --runtime-config ../runtime-config.json `
  --output-format sarif `
  --output results.sarif
```

Add `--debug` to watch discovery (`target 1/15`, `2/15`, …) and see the
full prompt sent per finding.

## Step 5 — What to expect

- Discovery reports **15 targets** (the report has 17 raw results;
  AGHAST de-duplicates findings that share a `file:line` location, so 15
  distinct locations become 15 targets).
- Overall status `FAIL` (some findings are confirmed real).
- Each target returns a verdict with reasoning: a confirmed finding
  becomes an issue; a false positive returns an empty issue array.
- In the SARIF results, `codeFlows` indicates a true positive
  (the finding has a real flow), while `suppressions` indicates a false
  positive / suppressed finding.

Open the SARIF/JSON report and read the reasoning per finding. The point
of the exercise is the **last** judgement: line the AI's verdicts up
against the code and decide where it got the triage right and where it
didn't. Some findings (client-side regexes, allowlisted command/path
arguments) are clear false positives; others (XSS, weak hashing, XXE, a
path traversal driven by an uploaded filename) are real. A weaker model
will confirm the obvious ones reliably and may waver on the findings that
need cross-function reasoning — that variance is itself the lesson about
where generic SAST + AI triage is strong and where it needs help.

## When it doesn't work

- **`0 targets` / SARIF not found** — `sarifFile` is being resolved
  against the wrong base. It is relative to the **target repo**
  (`../big-code-base`), not your solution folder. See Step 3.
- **"instructions file not found"** — the `../../../../big-code-base/context.md`
  path is off by a level. Count the hops from your check folder out to
  `aisast-exercises`, then into `big-code-base`.
- **`ERROR` status, no verdicts** — no provider/model is configured. See
  Step 4: set `agentProvider` in `../runtime-config.json` and pass it with
  `--runtime-config`.
