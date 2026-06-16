# 05-cli-01 (walkthrough) — Cross-file SSRF with Semgrep join mode

**Goal.** Detect an SSRF that spans two files: user input enters a Flask
route in `app.py`, is handed to a helper in `url_accessor.py`, and reaches
`requests.get(...)`. A single intra-file rule can't see across that call;
Semgrep **join mode** can, by correlating two sub-rules on a shared
metavariable.

You write **one line** — the `on:` join condition in the template.

You'll know you're done when the rule flags `/full_ssrf` (user-controlled
URL) and leaves `/safe_ssrf` (allowlisted subdomain) alone.

## Step 0 — Look at the target

```
app.py                              ← Flask routes: /full_ssrf, /safe_ssrf
url_accessor.py                     ← access_url(url) → requests.get(url)
05-cli-01-walkthrough.yml           ← the rule (reference answer)
05-cli-01-walkthrough-template.yml  ← same rule, join condition blanked
```

In `/full_ssrf`, `target = request.args.get("target")` is interpolated
straight into the URL and passed to `access_url`. In `/safe_ssrf` the user
value only *selects* a fixed subdomain, so the URL is never tainted.

## Step 1 — Why join mode

The taint crosses a function boundary: `app.py` builds the URL and calls
`access_url(url)`; the real sink — `requests.get` — lives in
`url_accessor.py`. Join mode runs two sub-rules and links their results:

- **source sub-rule** (`mode: taint`): source `request.args.get(...)`,
  sink `access_url($URL)` — captures the user-controlled value handed to
  the helper, binding it to `$URL`.
- **sink sub-rule**: `requests.get($URL, ...)` — the dangerous call,
  binding its argument to `$URL`.

Neither alone is an SSRF. The **join** says: the value passed to
`access_url` is the value that reaches `requests.get`.

## Step 2 — Write the join condition

Open `...-template.yml`. The join is blanked out:

```yaml
    on:
    - '$CHANGEME'
```

Replace it so the two sub-rules' `$URL` metavariables must be equal. Each
metavariable is namespaced by its sub-rule id:

```yaml
    on:
    - '05-cli-01-walkthrough_source_for_join_mode.$URL == 05-cli-01-walkthrough_sink_for_join_mode.$URL'
```

(The finished rule is in `05-cli-01-walkthrough.yml`.)

## Step 3 — Run it

```bash
semgrep scan --config ./05-cli-01-walkthrough-template.yml .
```

Expected: one finding — the `requests.get` reached from `/full_ssrf` — and
nothing for `/safe_ssrf`.

> **Windows + join mode.** Join mode relies on `socketpair()`, which
> Windows sometimes blocks (see the top-level README's Windows note). If
> the scan hangs or errors, run it under WSL/Linux (a regular Semgrep —
> including a **logged-in** one, `semgrep login` — runs join mode fine
> there) or use opengrep; the provided `.bat` runners call opengrep through
> WSL.

## Discussion

- Join mode is Semgrep's answer to cross-file / interprocedural flows that
  intra-file `mode: taint` can't follow. The cost is ceremony: two
  sub-rules plus a join condition.
- The join key here is the metavariable's matched text (`url`), which is
  why consistent argument naming matters. Production join rules usually key
  on something more robust than a variable name.
