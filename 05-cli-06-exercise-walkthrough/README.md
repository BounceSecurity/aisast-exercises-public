# 05-cli-06 (walkthrough) — Hybrid Semgrep + AI: provider smoke test

**Goal.** Confirm your AI provider is wired up correctly by running a
**pre-built** hybrid check: a permissive Semgrep rule finds candidate route
handlers, and the AI judges each one. You don't need to understand the
check — you need it to run end-to-end and produce **2 findings from 3
targets**.

## Step 1 — Configure your provider and run

The check calls the AI once per handler, so it needs a working provider.
Configure yours in the root `../runtime-config.json` (see the course slides
and the top-level README). Then, from inside the
`05-cli-06-exercise-walkthrough` folder, run the provided script:

```
./run.sh      # macOS / Linux / WSL
run.bat       # Windows
```

You should get **2 findings from 3 targets** (the table in Step 2). The
scripts also write a SARIF report to `codebase/results-test.sarif`.

If something looks wrong, run the same scan with `--debug` to see the full
AI prompt and Semgrep invocation:

```powershell
aghast scan codebase `
  --config-dir . `
  --runtime-config ../runtime-config.json `
  --debug
```

## Step 2 — What to expect

Three handlers are found; the AI judges each by tracing its call chain:

| Endpoint | Role | Length | Hours | Malicious | Verdict |
|---|:--:|:--:|:--:|:--:|---|
| `/api/v1/submit` | ✓ | ✓ | ✓ | ✓ | **PASS** |
| `/api/v1/execute` | ✓ | ✗ | ✓ | ✓ | **FAIL** — no length check |
| `/api/v1/run` | ✗ | ✓ | ✗ | ✗ | **FAIL** — only length check |

Overall `FAIL`, two issues — each located at the failing route handler and
listing the missing validations.

## What's actually happening (optional)

You don't need this to complete the exercise, but here's how the check works.

The files:

```
codebase/
  app.py
  auth.py          ← check_manager_role, check_query_length, is_business_hours
  ai_service.py    ← send_ai_query (the sink), checkForMaliciousPrompt
  routes/
    execute.py     ← /api/v1/execute
    run.py         ← /api/v1/run
    submit.py      ← /api/v1/submit
checks/
  aghast-importantvalidations-mc/
    *.yaml         ← Semgrep rule (finds handlers that call send_ai_query)
    *.md           ← AI prompt (the four validations to verify)
    *.json         ← check definition (targeted, semgrep discovery)
checks-config.json
run.sh / run.bat
```

The policy: before calling `send_ai_query(query)`, a handler must perform
**all four** checks —

1. **Role** — JWT payload has `"role": "manager"` (`check_manager_role`).
2. **Length** — query under 1000 chars (`check_query_length`).
3. **Business hours** — 09:00–17:00, Mon–Fri (`is_business_hours`).
4. **Malicious prompt** — `checkForMaliciousPrompt(query)` returns safe.

Missing even one is a FAIL.

**Semgrep (the easy half).** The rule matches any function that calls the
sink:

```yaml
pattern: |
  def $FUNC_NAME():
    ...
    send_ai_query($DATA)
    ...
```

That finds all three handlers — it does **not** try to check the
validations. (Deliberate: encoding "all four checks ran, in any order,
possibly inside helpers" as an AST pattern is exactly what static rules are
bad at.)

**The AI (the hard half).** `checkTarget.type: targeted` plus an
`instructionsFile` means AGHAST calls the AI once per matched handler with
the prompt in the `.md`. The prompt tells it to trace from the route
handler through `auth.py` / `ai_service.py` and confirm all four
validations precede the query.

**Notes.**

- **Why not pure Semgrep?** "All four checks ran before the sink, in any
  order, some via decorators, some via helper calls" is a counting +
  call-graph problem. A static rule would need a brittle thicket of
  `pattern-not` clauses and still couldn't follow into `auth.py`. The AI
  reads the call chain the way a reviewer does.
- **Keep the Semgrep half permissive.** Its only job is to find the sink
  call sites cheaply: every wasted match is one extra AI call, every missed
  match is a silent false negative. Match the sink, nothing more.
- **The prompt names everything.** It lists the four validations by
  function name and says "trace the full execution path". Vague prompts
  ("is this endpoint safe?") drift; concrete ones hold.
