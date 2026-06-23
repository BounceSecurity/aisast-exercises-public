# 07-cai-02 (walkthrough) — Static vs AI on the same policy

**Goal.** Enforce one access-control policy two different ways — a
pure Semgrep `static` check and a Semgrep-plus-AI `targeted` check —
against the *same* codebase, and see that on a simple, uniform
configuration **both produce identical results**.

This exercise teaches:
- The difference between a `static` check (Semgrep findings become
  issues directly, no AI, deterministic, free) and a `targeted`
  check (Semgrep finds candidates, the AI judges each one).
- How to invert policy logic in Semgrep with `pattern-not` so one
  rule covers every failure case without enumerating them.
- How a `targeted` check splits the work: Semgrep narrows the search
  space, the AI does the counting/reasoning per candidate.
- When the static approach is *preferable* — and the warning signs
  that it is about to stop being enough (continued in `07-cai-03`).

You'll know you're done when `aghast scan` reports **FAIL with 6
issues** for the static check and **FAIL with 6 issues** for the AI
check — the same 6 under-protected servers, flagged two different
ways, with zero false positives on the 6 well-protected servers.

---

## Step 0 — Look at the target

```
target/
  shared/
    protection-defaults.yaml   ← named IP ranges, OIDC providers, realms
  vhosts/
    admin-panel.yaml
    api-gateway.yaml
    dashboard.yaml
    docs-site.yaml
    monitoring.yaml
    partner-portal.yaml
    payments-service.yaml
```

The codebase is the NGINX reverse-proxy configuration for a
multi-environment platform. Each service team owns a YAML file under
`vhosts/`. Every entry declares one virtual server with fields for
`server_name`, `environment` (`production`, `staging`, `development`,
`preview`, `sandbox`, `uat`, `internal`), TLS settings, the
`upstream` backend, routing `locations`, and a `protection` block
holding zero or more access-control mechanisms.

There are three protection mechanisms:

- **`ip_allowlist`** — restricts access to CIDR ranges (named ranges
  live in `shared/protection-defaults.yaml`).
- **`oidc`** — delegates auth to a corporate/partner identity
  provider, optionally restricted to `required_groups`.
- **`basic_auth`** — HTTP Basic auth backed by an htpasswd `realm`.

Across the seven files there are **12 non-production servers**.
Production servers (`admin.example.com`, `api.example.com`, …) are
deliberately out of scope — they rely on their own hardened controls.

## Step 1 — The policy to enforce

> Every non-production server must have **at least two** of the three
> protection mechanisms (`ip_allowlist`, `oidc`, `basic_auth`) in its
> `protection` block.

The rationale is defence in depth: a single control is one
misconfiguration or credential leak away from total exposure. An IP
allowlist falls if a VPN or trusted host is breached; OIDC alone
exposes the login page and trusts the IdP completely; basic auth is
only as strong as the weakest password in the htpasswd file.
Requiring two means an attacker must defeat both at once.

The 12 non-production servers break down as:

| Server | Verdict | Reason |
|---|---|---|
| `admin-staging` | PASS | ip_allowlist + oidc + basic_auth |
| `api-staging` | PASS | ip_allowlist + oidc |
| `api-dev` | PASS | ip_allowlist + basic_auth |
| `dashboard-staging` | **FAIL** | oidc only |
| `docs-preview` | PASS | basic_auth + oidc |
| `grafana` | **FAIL** | ip_allowlist only |
| `prometheus` | **FAIL** | no protection block |
| `alertmanager` | PASS | basic_auth + ip_allowlist |
| `partners-sandbox` | PASS | oidc + ip_allowlist |
| `partners-dev` | **FAIL** | no protection block |
| `payments-staging` | **FAIL** | basic_auth only |
| `payments-uat` | **FAIL** | no protection block |

6 fail, 6 pass. Both checks below must reproduce exactly this split.

## Step 2 — Approach A: the static check

A `static` check needs no AI. Semgrep findings flow straight into the
report as issues — deterministic and free.

`aghast-nginx-vhost-protection-static.json` (Layer 2 definition):

```json
{
  "id": "aghast-nginx-vhost-protection-static",
  "name": "Missing Protection on Non-Production NGINX Virtual Hosts (Static)",
  "severity": "medium",
  "confidence": "high",
  "checkTarget": {
    "type": "static",
    "discovery": "semgrep",
    "rules": "aghast-nginx-vhost-protection-static.yaml"
  }
}
```

`checkTarget.type: "static"` is the signal: no `instructionsFile`,
no AI call — Semgrep matches become issues 1:1.

The rule does **not** enumerate the failure cases (no protection,
ip-only, oidc-only, basic-only). It inverts the logic: match every
server, exclude production, then exclude any server that has *any
valid pair* of mechanisms. Whatever escapes all the exclusions has
fewer than two mechanisms.

```yaml
rules:
  - id: aghast-nginx-vhost-protection-static
    patterns:
      - pattern: |
          - server_name: $NAME
            ...
      - pattern-not: |
          - server_name: $NAME
            environment: production
            ...
      - pattern-not: |          # excludes ip_allowlist + oidc
          - server_name: $NAME
            ...
            protection:
              ...
              ip_allowlist:
                ...
              ...
              oidc:
                ...
      - pattern-not: |          # excludes ip_allowlist + basic_auth
          - server_name: $NAME
            ...
            protection:
              ...
              ip_allowlist:
                ...
              ...
              basic_auth:
                ...
      - pattern-not: |          # excludes oidc + basic_auth
          - server_name: $NAME
            ...
            protection:
              ...
              oidc:
                ...
              ...
              basic_auth:
                ...
    message: >
      Non-production NGINX virtual host "$NAME" has fewer than two
      protection mechanisms. ...
    languages: [yaml]
    severity: ERROR
```

The three pair-exclusion `pattern-not` clauses cover every possible
pair of the three mechanisms. A server is excluded — produces no
finding — if it has *any* pair. That is exactly equivalent to
"requires ≥ 2", with no special-casing:

| State | Outcome |
|---|---|
| No `protection` block | no pair → fires |
| Only `ip_allowlist` | no pair → fires |
| Only `oidc` | no pair → fires |
| Only `basic_auth` | no pair → fires |
| Two or more mechanisms | a pair present → excluded → PASS |

## Step 3 — Approach B: the AI (targeted) check

A `targeted` check splits the work in two: Semgrep finds the
candidates, then the AI is asked one focused question about each.

`aghast-nginx-vhost-protection-mc.json`:

```json
{
  "id": "aghast-nginx-vhost-protection-mc",
  "name": "Missing Protection on Non-Production NGINX Virtual Hosts",
  "instructionsFile": "aghast-nginx-vhost-protection-mc.md",
  "severity": "medium",
  "confidence": "high",
  "checkTarget": {
    "type": "targeted",
    "discovery": "semgrep",
    "rules": "aghast-nginx-vhost-protection-mc.yaml"
  }
}
```

`checkTarget.type: "targeted"` plus an `instructionsFile`: Semgrep
discovers targets, the AI analyses each one with that prompt.

Here the Semgrep rule does **only the easy half** — find every
non-production server. It does not try to count mechanisms:

```yaml
rules:
  - id: aghast-nginx-vhost-protection-mc
    patterns:
      - pattern: |
          - server_name: $NAME
            environment: $ENV
            ...
      - metavariable-regex:
          metavariable: $ENV
          regex: ^(?!production$).*$
    message: >
      Non-production NGINX virtual host "$NAME" (environment: $ENV)
      found. Verify it has at least two distinct protection
      mechanisms ...
    languages: [yaml]
    severity: WARNING
```

That matches all **12** non-production servers. The counting is
delegated to the AI via a short prompt
(`aghast-nginx-vhost-protection-mc.md`):

```markdown
#### What to Check
1. Count how many of `ip_allowlist`, `oidc`, and `basic_auth` are
   present under `protection`.
2. If two or more → PASS.
3. If zero or one → FAIL. Report the server name, environment,
   what's present, and what's missing.
```

AGHAST sends one prompt per discovered target; the AI returns PASS or
FAIL for that server. 12 targets analysed, 6 come back FAIL.

## Step 4 — Scan

From inside the exercise folder:

```powershell
aghast scan target --config-dir solution
```
If you set your AI provider in the runtime-config.json file you need to add `--runtime-config <path-to-runtime-config.json>` to your command.
s
The static check needs no API key. The `-mc` check calls the AI, so
set `ANTHROPIC_API_KEY` (or `AGHAST_LOCAL_CLAUDE=true`) before
running, or it will report `ERROR`.

Expected: overall `FAIL`, **6 total issues** —

```
aghast-nginx-vhost-protection-static : FAIL (6 findings, 6 targets)
aghast-nginx-vhost-protection-mc     : FAIL (6 issues, 12 targets)
```

Open `target/security_checks_results.json`. Both checks flag the
same six servers: `dashboard-staging`, `grafana`, `prometheus`,
`partners-dev`, `payments-staging`, `payments-uat`. The six
well-protected servers are not flagged by either.

> Tip: to check just the static half without an API key, the run
> still works — the `-mc` check will simply `ERROR` while the
> `static` check produces its 6 findings.

## Discussion

**Both checks agree here. Why run the AI at all?** On this codebase
the static rule is arguably *preferable*: it is deterministic, costs
nothing, and needs no key. The codebase has every property that
favours static analysis:

- protection is always declared **inline** (no indirection),
- there are only **three mechanisms** (manageable combinatorics),
- a **flat threshold** applies to every server (no conditional
  logic),
- the **schema is uniform** (same `environment` field, same
  `protection` keys everywhere).

When all four hold, prefer the static check.

**So when does AI earn its cost?** When any of those properties
break. If protection can be inherited from a shared profile, or the
threshold depends on internet vs. internal exposure, or mechanisms
combine conditionally, the inverted-`pattern-not` trick stops
scaling — you would need a combinatorial explosion of rules, and
Semgrep still cannot follow a reference into `shared/`. That is
exactly the codebase in **`07-cai-03-walkthrough-complex`**: the
same policy idea, evolved realistically, where the static rule
breaks and the AI check keeps working. Do that one next.

**The general pattern.** A `targeted` check is the middle ground:
let Semgrep cheaply narrow thousands of files to a handful of
candidates, then spend AI tokens only on the judgement Semgrep
cannot make. Here the judgement ("count ≥ 2") is simple enough that
Semgrep can also do it — so the static check wins. The skill is
recognising which side of that line a given policy falls on.
