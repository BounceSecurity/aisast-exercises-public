# 07-cai-03 (walkthrough) — When the static rule breaks

**Goal.** Take the *same* policy idea as `07-cai-02` and run it
against a realistically-evolved configuration. Watch the pure
Semgrep `static` check still get the right answer — but only by
hardcoding brittle assumptions — while the Semgrep-plus-AI
`targeted` check expresses the policy and stays robust.

This exercise teaches:
- Why `static` checks degrade when a config gains indirection
  (shared profiles), more mechanisms, and conditional thresholds.
- How a `targeted` check keeps the Semgrep half trivial (just
  "find the candidates") and pushes the hard reasoning into the
  AI prompt — including reading a *second* file.
- How to read the maintenance/fragility trade-off, not just the
  pass/fail result. Both checks find the same 6 today; that is
  not the whole story.

Do `07-cai-02-walkthrough-simple` first — this is the
"same policy, harder codebase" follow-up to it.

You'll know you're done when `aghast scan` reports **FAIL with 6
issues** for the static check (6 findings / 6 targets) and **FAIL
with 6 issues** for the AI check (6 issues / 13 targets) — the
same six under-protected servers, zero false positives on the
seven that pass.

---

## Step 0 — Look at the target

```
target/
  shared/
    protection-profiles.yaml   ← named profiles expand to mechanisms
  vhosts/
    admin-panel.yaml  api-gateway.yaml  dashboard.yaml
    docs-site.yaml    monitoring.yaml   partner-portal.yaml
    payments-service.yaml
```

Same domain as `07-cai-02`, but with the four complications real
configuration accumulates over time:

1. **Protection profiles.** Instead of listing mechanisms inline, a
   server can say `protection.profile: internal-strict`. The profile
   definitions live in a *separate* file,
   `shared/protection-profiles.yaml`. Effective protection is
   whatever the profile expands to.
2. **A fourth mechanism — `mtls`.** Mutual TLS joins `ip_allowlist`,
   `oidc`, and `basic_auth`. Four mechanisms now, not three.
3. **An `exposure` field.** Every server declares
   `exposure: internet` or `exposure: internal`, which changes how
   much protection it needs.
4. **Mixed sources.** A server can reference a profile *and* add
   inline mechanisms. The effective set is the **union** of both.

The five profiles in `shared/protection-profiles.yaml`:

| Profile | Mechanisms | Count |
|---|---|---|
| `internal-standard` | ip_allowlist + basic_auth | 2 |
| `internal-strict` | ip_allowlist + oidc + basic_auth | 3 |
| `partner-access` | oidc + ip_allowlist | 2 |
| `internet-facing` | oidc + ip_allowlist + mtls | 3 |
| `monitoring-basic` | ip_allowlist | 1 |

There are **13 non-production servers**. Production servers are out
of scope.

## Step 1 — The policy to enforce

The threshold is no longer flat — it depends on `exposure`:

> - **Internet-facing** non-production servers require **at least 3**
>   of the four mechanisms.
> - **Internal** (or any non-`internet`) non-production servers
>   require **at least 2**.
> - Mechanisms count as the **union** of the referenced profile's
>   mechanisms and any inline mechanisms.
> - `environment: production` servers are excluded.

Internet exposure carries the heavier requirement because the blast
radius is larger — an internet-reachable non-production host is a far
more attractive target than an internal-only one.

Expected outcomes for the 13 servers:

| Server | Exposure | Required | Have | Verdict |
|---|---|---|---|---|
| `admin-staging` | internal | 2 | 4 | PASS |
| `api-staging` | internal | 2 | 3 | PASS |
| `api-dev` | internal | 2 | 2 | PASS |
| `dashboard-staging` | internet | 3 | 2 | **FAIL** |
| `dashboard-dev` | internal | 2 | 1 | **FAIL** |
| `docs-preview` | internal | 2 | 2 | PASS |
| `grafana` | internal | 2 | 1 | **FAIL** |
| `prometheus` | internal | 2 | 0 | **FAIL** |
| `alertmanager` | internal | 2 | 2 | PASS |
| `partners-sandbox` | internet | 3 | 3 | PASS |
| `partners-dev` | internal | 2 | 0 | **FAIL** |
| `payments-staging` | internet | 3 | 3 | PASS |
| `payments-uat` | internal | 2 | 0 | **FAIL** |

6 fail, 7 pass. Both checks must reproduce exactly this split.

## Step 2 — Approach A: the static check (and why it strains)

`aghast-nginx-vhost-protection-complex-static.json` declares a
`static` check (`checkTarget.type: "static"`, no `instructionsFile`)
— Semgrep matches become issues 1:1, no AI.

Semgrep **cannot follow a `profile:` reference** into
`shared/protection-profiles.yaml`, so the rule cannot actually count
a profile's mechanisms. The rule file (~170 lines) works around this
with **three narrowly-targeted sub-rules**:

**Case 1 — No protection block.** Matches any non-production server
with no `protection:` key. Catches `prometheus`, `partners-dev`,
`payments-uat` (3 findings).

**Case 2 — Known-insufficient profile, no inline supplements.**
Matches non-production servers whose `protection.profile` is
`monitoring-basic`, matched **by literal name** via
`metavariable-regex`, with `pattern-not` clauses ensuring no inline
`ip_allowlist` / `oidc` / `basic_auth` / `mtls` makes up the
shortfall. Catches `dashboard-dev`, `grafana` (2 findings). This only
works because the rule *hardcodes* that `monitoring-basic` resolves
to one mechanism — Semgrep never reads the profile file.

**Case 3 — Internet-facing, inline-only, fewer than 3.** Matches
internet-facing non-production servers that have an inline
`protection` block and **no** `profile:` reference, then uses **four
`pattern-not` clauses — one per 3-of-4 mechanism combination**
(`ip+oidc+basic`, `ip+oidc+mtls`, `ip+basic+mtls`, `oidc+basic+mtls`),
each with `...` between keys so any ordering is absorbed. Catches
`dashboard-staging` (1 finding).

```yaml
# Case 3, the four 3-of-4 exclusions (abridged)
- pattern-not: |
    - server_name: $NAME
      environment: $ENV
      ...
      protection:
        ...
        ip_allowlist:
          ...
        ...
        oidc:
          ...
        ...
        basic_auth:
          ...
# ...three more: ip+oidc+mtls, ip+basic+mtls, oidc+basic+mtls
```

The `...` between keys is what keeps this at **four** clauses rather
than exploding into every key ordering — Semgrep's `...` absorbs
intervening and reordered keys.

It gets the right answer here, but every sub-rule encodes a brittle
assumption:

- **Case 2 hardcodes `monitoring-basic`.** Add another thin profile,
  or expand `monitoring-basic`, and the rule silently produces
  false negatives/positives — nothing tracks the profile file.
- **Case 3 only covers inline-only internet servers.** An
  internet-facing server referencing a 2-mechanism profile with no
  inline supplement is a real violation, but the `pattern-not` on
  `profile:` makes the static rule skip it. It just happens not to
  exist in this dataset.
- **The 3-of-N exclusion list is combinatorial.** A fifth mechanism
  turns 3-of-4 (4 clauses) into 3-of-5 (10 clauses), regenerated by
  hand.

## Step 3 — Approach B: the AI (targeted) check

`aghast-nginx-vhost-protection-complex-mc.json` declares a
`targeted` check with an `instructionsFile`. The Semgrep rule does
**only the trivial half** — find every non-production server (same
`pattern` + `metavariable-regex` on `$ENV` as `07-cai-02`'s `-mc`
rule). All 13 non-production servers become targets.

The hard reasoning lives in the prompt
(`aghast-nginx-vhost-protection-complex-mc.md`):

```markdown
#### What to Check
1. Read the `exposure` field to determine the threshold
   (internet=3, otherwise=2).
2. If `protection.profile` is set, look up that profile in
   `shared/protection-profiles.yaml` and note its mechanisms.
3. Note any mechanisms defined inline alongside the profile.
4. Count the total distinct mechanisms (union of profile + inline).
5. If count < threshold → FAIL. Report server name, environment,
   exposure, what's present, and the shortfall.
```

The AI reads *both* files, resolves the profile, unions it with
inline mechanisms, applies the exposure-based threshold, and reports
shortfalls — exactly the cross-file conditional logic Semgrep cannot
do. The discovery rule never changes, regardless of how the schema
evolves.

## Step 4 — Scan

From inside the exercise folder:

```powershell
aghast scan target --config-dir solution
```
If you set your AI provider in the runtime-config.json file you need to add `--runtime-config <path-to-runtime-config.json>` to your command.

The static check needs no API key. The `-complex-mc` check calls the
AI, so set `ANTHROPIC_API_KEY` (or `AGHAST_LOCAL_CLAUDE=true`) first,
or it reports `ERROR`.

Expected: overall `FAIL`, **6 total issues** —

```
aghast-nginx-vhost-protection-complex-static : FAIL (6 findings, 6 targets)
aghast-nginx-vhost-protection-complex-mc     : FAIL (6 issues, 13 targets)
```

Both flag the same six: `dashboard-staging`, `dashboard-dev`,
`grafana`, `prometheus`, `partners-dev`, `payments-uat`. The seven
that pass are not flagged by either.

> Tip: to exercise just the static half without an API key, run as
> above — the `-complex-mc` check will `ERROR` while the static
> check still produces its 6 findings.

## Discussion

**Both checks agree — so why does this exercise exist?** Because the
result is identical but the *cost* is not. Compare the two halves of
this same policy across `07-cai-02` (simple) and `07-cai-03`
(complex):

| | Static (Semgrep only) | AI (Semgrep + prompt) |
|---|---|---|
| Findings / false positives | 6/6 · 0 | 6/6 · 0 |
| Rule / prompt size | ~170 lines YAML, 3 sub-rules | ~17 lines markdown |
| Profile handling | hardcoded by name | resolved dynamically |
| Add a 5th mechanism | regenerate the 3-of-N exclusions | add one bullet |
| Add a new weak profile | new hardcoded sub-rule | already covered |
| Change the threshold policy | restructure rules | edit a sentence |

In `07-cai-02` every property favoured static analysis (inline,
3 mechanisms, flat threshold, uniform schema) and the static rule
was *preferable*. Here all four broke at once: indirection, a fourth
mechanism, an exposure-based threshold, and mixed sources. The
static rule survives only by freezing today's profile names,
mechanism lists, and orderings into rigid patterns — correct now,
fragile on the next schema change.

**The lesson.** Static analysis wins when patterns are simple,
stable, and syntactically regular. The `targeted` (Semgrep + AI)
shape earns its token cost exactly when the problem needs semantic
understanding — following a reference into another file, applying
conditional logic, reasoning about configurations that vary in
structure. The skill is recognising which side of that line a policy
sits on *before* you write 170 lines of YAML.
