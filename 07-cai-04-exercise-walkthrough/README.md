# Exercise 05 (walkthrough) — Hybrid: Semgrep finds, AI judges

**Goal.** Build an AGHAST `targeted` check that flags every Express
handler that calls `paymentApi.charge(...)` **without first validating**
the request fields it forwards.

This is the most common AGHAST shape in practice: a permissive Semgrep
rule narrows the scope to "interesting call sites", and the AI is then
invoked **once per match** to do the contextual reasoning a static rule
can't.

You'll know you're done when `aghast scan` reports `FAIL`, with the BAD
handlers (`/refund`, `/topup`, `/donate`) producing issues and the GOOD
handlers (`/checkout`, `/subscribe`) returning empty issue arrays.

---

## Step 0 — Look at the target

```
target/
  src/
    payment-api.js                 ← stub external client
    routes/
      checkout-good.js             ← validates amount, currency, customerId   (OK)
      subscription-good.js         ← validates plan + customerId, fixed price (OK)
      refund-bad.js                ← forwards req.body fields, no checks      (BAD)
      topup-bad.js                 ← spreads req.body straight in             (BAD)
      donate-bad.js                ← parseFloat is NOT validation             (BAD)
    server.js
```

Open them. Notice that every handler eventually calls
`paymentApi.charge(...)`. Whether each call is a bug depends on what
happens *before* it — which is exactly the kind of "look at the
surrounding code" reasoning Semgrep alone is bad at.

## Step 1 — Why hybrid?

A pure-Semgrep version of this check would have to encode "amount is
validated" as an AST pattern. Try it: you'd need to express
`typeof amount === "number"` AND `amount > 0` AND `amount < MAX` AND
allowlists for currency AND customerId regex AND so on… across handlers
written in many different styles. Static rules drown in false positives
or false negatives long before they get there.

The hybrid pattern instead splits the work:
1. **Semgrep**: high-recall pattern that finds every `paymentApi.charge`
   call (or every dangerous-function call, every SQL query, etc.).
2. **AI**: invoked **once per match** with that match's surrounding
   code. It answers a single, narrow question: "is this specific call
   site safe?"

## Step 2 — Write the Semgrep rule (`solution/checks/aghast-payment-input-validation/aghast-payment-input-validation.yaml`)

```yaml
rules:
  - id: aghast-payment-input-validation
    languages: [javascript, typescript]
    severity: ERROR
    message: |
      paymentApi.charge(...) call site — verify that the surrounding
      Express handler validates request input before this call.
    pattern: paymentApi.charge(...)
```

That's the entire rule. We **want** it to be permissive — every
`paymentApi.charge` call site is a target the AI should look at. The
AI then decides per match whether the surrounding code validates input.

> **YAML colon trap.** If your pattern contains an object literal like
> `{amount: $X}`, write it as `pattern: |` followed by the pattern on
> the next line — otherwise YAML eats the colon.

## Step 3 — The check definition (`aghast-payment-input-validation.json`)

```json
{
  "id": "aghast-payment-input-validation",
  "name": "Express handler calls paymentApi.charge without validating input",
  "instructionsFile": "aghast-payment-input-validation.md",
  "severity": "high",
  "confidence": "medium",
  "checkTarget": {
    "type": "targeted",
    "discovery": "semgrep",
    "rules": "aghast-payment-input-validation.yaml",
    "maxTargets": 50
  }
}
```

The new bits compared with Exercise 01:

- `"type": "targeted"` — AGHAST will run Semgrep, then call the AI once
  per match. (Exercise 01 used `static`, which skipped the AI entirely.)
- `"instructionsFile"` — the markdown prompt the AI reads. Required for
  targeted checks (the AI needs to know *what* to look for).
- `"maxTargets"` — safety cap so a runaway pattern can't cost you 5,000
  AI calls.

## Step 4 — Write the AI prompt (`aghast-payment-input-validation.md`)

The AI sees ONE call site at a time, plus the surrounding code in that
file, plus the prompt. So the prompt needs to:

1. Tell the AI what the call site is.
2. Tell it what request data even looks like (`req.body`, `req.query`,
   `req.params`, `req.headers`).
3. Be **concrete** about what counts as validation — and what doesn't.
   "Is the input validated?" is too vague. "Type check / range check /
   allowlist count; `parseFloat` alone does not" is enforceable.
4. Tell it the verdict format: empty `issues` for OK, one issue for BAD.

Keep it under 40 lines — long prompts drift.

## Step 5 — Run the scan

From inside the exercise folder:

```powershell
aghast scan target --config-dir solution
```

This takes 1–3 minutes — there are 5 Semgrep matches and the AI runs
once per match. Watch the log: you'll see `target 1/5`, `target 2/5`, …

Open `target/security_checks_results.json`. Expected:

- Overall status: `FAIL`.
- Three issues, located at the `paymentApi.charge` lines in
  `refund-bad.js`, `topup-bad.js`, and `donate-bad.js`.
- The two GOOD handlers contributed zero issues.

## Discussion

- **Tighten the Semgrep rule, lighten the AI work.** If you taught the
  rule to recognise the `if (typeof amount !== "number") return res...`
  shape and skip those matches, you'd save AI calls — at the cost of
  rule complexity and missing weirdly-spelled validations. The
  trade-off is the whole game.
- **Per-match prompts must reference the match.** AGHAST gives the AI
  the file/line of the match. Don't write a prompt that asks "find
  validation bugs in the codebase" — ask "for the call site at
  `<file>:<line>`, is the surrounding handler safe?". Concrete, single
  question.
- **`parseFloat` was a deliberate trap.** A weaker prompt will mark
  `donate-bad.js` as fine because "the code converts to a number".
  Spelling out "coercion is not validation" in the prompt fixes it.
