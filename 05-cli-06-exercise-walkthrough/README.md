# 05-cli-06 (walkthrough) — Semgrep finds, the AI traces the call chain

**Goal.** Build a `targeted` AGHAST check over a small Python AI-gateway
service. A permissive Semgrep rule finds every route handler that
dispatches a query to the AI backend; the AI is then invoked once per
handler to verify that **all four** required validations run *before* the
query is sent — following the call chain through helper functions.

This is the AI half of the hybrid pattern (compare `07-cai-04`), applied
to a policy that needs cross-function reasoning Semgrep can't do alone.

You'll know you're done when `aghast scan` reports `FAIL`, flagging the two
handlers that skip validations and passing the one that does them all.

## Step 0 — Look at the target

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

## Step 1 — The two halves

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

## Step 2 — Configure your model and run

This check calls the AI once per handler, so supply your own model in
`../runtime-config.json` (see the top-level README). Then, from the
`aghast-internal` repo root:

```powershell
node --import tsx src/cli.ts scan `
  ..\aisast-exercises\05-cli-06-exercise-walkthrough\codebase `
  --config-dir ..\aisast-exercises\05-cli-06-exercise-walkthrough `
  --runtime-config ..\aisast-exercises\runtime-config.json
```

(The provided `run.sh` / `run.bat` do the same and write a SARIF report to
`codebase/results-test.sarif`.)

## Step 3 — What to expect

Three handlers are found; the AI judges each by tracing its call chain:

| Endpoint | Role | Length | Hours | Malicious | Verdict |
|---|:--:|:--:|:--:|:--:|---|
| `/api/v1/submit` | ✓ | ✓ | ✓ | ✓ | **PASS** |
| `/api/v1/execute` | ✓ | ✗ | ✓ | ✓ | **FAIL** — no length check |
| `/api/v1/run` | ✗ | ✓ | ✗ | ✗ | **FAIL** — only length check |

Overall `FAIL`, two issues — each located at the failing route handler and
listing the missing validations.

## Discussion

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
