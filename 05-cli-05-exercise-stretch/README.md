# 05-cli-05 (advanced) — SSRF taint flow

## Goal

Build an AGHAST `static` check that flags every outbound HTTP call
in `target/src/routes/` whose destination URL is influenced by
client-supplied data and is **not** washed through the project's
allowlist function `validateUrl()`.

## Scope

The target codebase has five route files:

| File | Verdict |
|------|---------|
| `proxy.js`    | BAD — raw `req.query.url` straight into `axios.get`. |
| `webhook.js`  | OK — `validateUrl(req.body.callbackUrl)` first.       |
| `preview.js`  | BAD — `new URL(...)` is parsing, not validation.      |
| `avatar.js`   | Discussion point — host hardcoded, path from request. |
| `callback.js` | BAD — `req.body.host` concatenated into the URL.      |

Outbound HTTP libraries to consider as sinks: `axios.{get,post,put,
delete,request}`, `fetch`, `http.{get,request}`, `https.{get,request}`.

## Constraints

- Use `mode: taint`.
- The only sanitiser that should clear the taint is `validateUrl()`
  — `new URL()` does NOT count.
- Use `focus-metavariable` to ensure the sink only flags taint
  reaching the URL position, not unrelated arguments (POST body, etc.).

## Hints

- Sources should cover request bodies, query strings, and route
  params. Don't forget bracket-access (`req.body[name]`) as well as
  dot-access (`req.body.name`).
- `axios.request({ url, method, ... })` takes a config object, not
  a positional URL. To match it, use `axios.request({..., url:
  $URL, ...})` — and remember the YAML colon-in-flow-mapping trap:
  this pattern must use the `pattern: |` block-scalar form.

## Done when

`aghast scan target --config-dir solution` reports `FAIL` with **4
findings**:
`proxy.js`, `preview.js`, `callback.js`, **and** `avatar.js`.

The webhook is correctly silent.

## Why does `avatar.js` show up?

Strictly, the host is hardcoded — an attacker can't pivot to internal
IPs. But `req.params.id` flows into the URL path, so a value like
`"../../../admin"` could pivot the *path*. Whether that's "real
SSRF" depends on the upstream server. Static taint rules can't
make that judgement, so they (correctly) flag it. In a real triage
you'd:

- decide whether path-only taint is in-scope for SSRF, and either
- accept the finding as "investigate further", or
- add `parseInt(...)` / a regex sanitiser if the id is constrained,
  or
- annotate the line with `// nosemgrep:` if you've reviewed and
  accepted the risk.
