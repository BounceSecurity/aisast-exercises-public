# 05-cli-03 (advanced) — Insecure CORS

## Goal

Build an AGHAST `static` check that flags **every insecure CORS
configuration** in `target/`, while leaving the safe ones alone.

What "insecure" means here:

- `cors()` called with no options. The `cors` package defaults to
  `Access-Control-Allow-Origin: *`.
- `cors({ origin: "*", ... })` — wildcard origin set explicitly.
- A response middleware that copies `req.headers.origin` straight
  into `Access-Control-Allow-Origin` (blind reflection).

What MUST stay un-flagged:

- `cors({ origin: ["https://app.example.com", ...] })` — explicit
  allowlist.
- `cors({ origin: (origin, cb) => ... })` — function-based check.

## Setup

The target codebase is in `target/`. Build your own check folder
following the structure you used in the walkthrough — `checks-config.json`
+ `checks/<id>/<id>.json` + `<id>.yaml`. Use `static` discovery.

## Constraints

- One AGHAST check, but you may use **multiple Semgrep rules inside
  one YAML file** (they share the check id but have their own rule
  ids). Use this to keep each rule simple.
- Try the rule against the codebase with `semgrep --config <yaml>
  target/` first, then with `aghast scan target --config-dir solution`.

## Hints

- `pattern-either:` lets you say "match any of these patterns".
- For object-literal patterns, use `{..., key: value, ...}` rather
  than the exact shape — Semgrep's `...` glues different orderings
  together.
- The reflection bug is hand-rolled middleware, not a `cors()` call.
  Match `res.setHeader(...)` / `res.header(...)`.

## Done when

`aghast scan target --config-dir solution` reports `FAIL` with **at
least 3 findings** — the wildcard call in `src/public-api.js`, the
default `cors()` in `src/admin-api.js`, and the reflection middleware
in `src/reflect-api.js`. The webhook and internal APIs must NOT be
flagged.
