# AGHAST hands-on exercises

Hands-on exercises that teach how to write security checks for
[AGHAST](https://github.com/BounceSecurity/aghast). They build up in
layers: first writing raw Semgrep rules on the command line, then
wrapping Semgrep findings in an AGHAST `static` check, then AI-only
`repository` checks, then hybrid checks where Semgrep finds candidates
and the AI judges each one, and finally triaging a third-party SAST
report with AI.

## How the exercises are structured

Exercises come in two shapes.

**AGHAST exercises** (most of them) are self-contained folders:

```
NN-xxx-YYY-walkthrough/   ← guided, step-by-step
  README.md               ← instructions and explanation
  target/ or codebase/    ← vulnerable codebase you scan

NN-xxx-YYY-exercise-stretch/  ← goal only, no walkthrough
  README.md
  target/
```

- **Walkthrough** exercises walk you through writing the check from
  scratch and explain every decision.
- **Exercise / stretch** exercises give you the goal, constraints, and a
  few hints.

One exception: `05-cli-06` ships its check ready to run at the folder root
(not in `solution/`) — it's a quick smoke test that your AI provider works,
not a build-it exercise.

**Semgrep-CLI exercises** — `04-rca-04` and `05-cli-01` — skip the AGHAST
machinery: you run Semgrep (or opengrep) against the files directly. In
`04-rca-04` the sample file carries `// ruleid:` / `// ok:` test annotations
and you verify the rule with `--test`; in `05-cli-01` you run the scan and
read the findings. From `05-cli-02` on, exercises run through AGHAST
(`aghast scan`).

One target, `big-code-base/`, is shared rather than living inside an
exercise folder: it is a full Next.js banking app with a pre-generated
Semgrep SARIF report, used by `07-cai-01`.

## The exercises

Take them roughly in order — each module builds on the previous one's
vocabulary.

| Folder | Kind | What it teaches | Tools |
|---|---|---|---|
| `04-rca-04-exercise` | rule + tests | Writing a Semgrep **taint-mode** rule: `pattern-sources` / `pattern-sinks` / `pattern-sanitizers` for a DOM-XSS flow. | Semgrep |
| `05-cli-01-walkthrough` | walkthrough | Cross-file SSRF with Semgrep **join mode**: correlate a taint source and a sink across two files. | Semgrep |
| `05-cli-02-walkthrough` | walkthrough | One AST pattern, metavariables, `metavariable-regex`. The shape of an AGHAST `static` check. | Semgrep |
| `05-cli-03-exercise-stretch` | stretch | The same idea, unguided. | Semgrep |
| `05-cli-04-walkthrough` | walkthrough | Sources / sinks / sanitizers, `focus-metavariable`, intra-file taint flow. | Semgrep |
| `05-cli-05-exercise-stretch` | stretch | The same idea, unguided. | Semgrep |
| `05-cli-06-exercise-walkthrough` | walkthrough | Run a **provided** hybrid (`targeted`) check on a Python AI-gateway service — Semgrep finds call sites, the AI judges whether each validates input first. Mainly a smoke test that your AI provider works end-to-end. | Semgrep + AI |
| `06-bai-01-exercise-walkthrough` | walkthrough | The shape of a `repository` check. Writing a clear, concrete markdown prompt. | AI |
| `06-bai-02-exercise-stretch` | stretch | The same idea, unguided. | AI |
| `06-bai-03-exercise-walkthrough` | walkthrough | Cross-file reasoning. Naming sinks, sensitive fields, safe vs unsafe transforms. | AI |
| `06-bai-04-exercise-stretch` | stretch | The same idea, unguided. | AI |
| `07-cai-01-exercise-generic-sast` | exercise | Triage a raw Semgrep SARIF report with AI: SARIF discovery + the built-in `false-positive-validation` mode. Scans the shared `big-code-base/`. | SARIF + AI |
| `07-cai-02-walkthrough-simple` | walkthrough | Static vs AI on the *same* policy (NGINX vhost protection) — both agree on a simple, uniform config. | Semgrep / AI |
| `07-cai-03-walkthrough-complex` | walkthrough | The same policy evolved: the `static` rule turns brittle while the `targeted` (AI) check stays robust. | Semgrep + AI |
| `07-cai-04-exercise-walkthrough` | exercise | Hybrid: a permissive Semgrep rule finds every dangerous call site, the AI judges per call whether input is validated. | Semgrep + AI |
| `07-cai-05-exercise-stretch` | stretch | Tainted dangerous sinks (`eval`, `exec`, …): find each sink, let the AI decide if the argument is attacker-influenced. Goal-only. | Semgrep + AI |

## Prerequisites

| Need | Used by | How to install |
|---|---|---|
| Node.js ≥ 20 | All AGHAST exercises | https://nodejs.org/ |
| Git | All | targets are scanned as git repositories |
| Semgrep | `04-rca`, `05-cli-*`, hybrid `07-cai-*` | `pip install semgrep` (Linux/macOS preferred — see Windows note below) |
| opengrep (conditional) | `05-cli-01` on **native Windows** | https://github.com/opengrep/opengrep — only needed to run the join-mode exercise on Windows; skip it if you use WSL-Semgrep or a logged-in Pro Semgrep. See Windows note. |
| An AI model | `05-cli-06`, `06-bai-*`, `07-cai-*` | you supply your own — see below |

**Configuring an AI model.** The AI-backed exercises call a model once per
target, and you supply your **own** provider and model. Set
`agentProvider.name` and `agentProvider.model` in `runtime-config.json`
and pass it on the scan with `--runtime-config <path>`; or set
`ANTHROPIC_API_KEY` (and `--model <id>`); or set `AGHAST_LOCAL_CLAUDE=true`
to use a local Claude CLI. `07-cai-01` ships a pre-generated SARIF report,
so it needs an AI model but **not** Semgrep.

Run `git status` inside any target before you scan it — the targets must
be git repos so AGHAST can attach repo metadata and Semgrep can scope to
tracked files. If a target lacks a `.git/` folder (e.g. you copied it
elsewhere), initialise it once:

```bash
cd path/to/target
git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -q -m init
```

### Windows note

Semgrep `mode: join` is unreliable on Windows because the engine uses
`socketpair()`, which the OS sometimes blocks. The `05-cli-04` taint
exercises use `mode: taint` which works everywhere. The walkthrough README
has the join-mode equivalent in an appendix for completeness.

`05-cli-01` is a dedicated join-mode walkthrough, so it hits this issue
head-on. As a workaround it ships `.bat` runners that call **opengrep**
(an open-source Semgrep-compatible engine) through WSL. opengrep is an
optional alternative engine, not a prerequisite — a logged-in (Pro)
Semgrep, or any Semgrep on WSL/Linux, runs join mode fine too. The
`*-og*.bat` runners in `05-cli-01` and `04-rca-04` use it; the `*-sg*.bat`
runners use Semgrep.

## When a scan doesn't match expectations

- **Semgrep error / `ERROR` status with no findings** — usually a
  YAML parse error in your rule. Run `semgrep --config <yaml> <target>`
  on its own; the parser error will be clearer. The most common bug
  is the **YAML colon trap**: any pattern that contains an object
  literal like `{key: value}` MUST be written as `pattern: |` block
  scalar, otherwise YAML eats the colon.
- **AI finding misses the bug or invents one** — the prompt is too
  vague. Name the sink functions, name the sensitive fields, list
  what does NOT count. Concrete prompts beat clever prose. See the
  `06-bai-01` walkthrough README's "Why this prompt works" section.
- **Targeted check returns wrong number of targets** — the Semgrep
  rule is matching too narrowly (false negatives) or too broadly
  (wasted AI calls). The `--debug` flag shows what Semgrep matched.
- **AI exercise reports `ERROR` with no verdicts** — no model is
  configured. Set `agentProvider` in `runtime-config.json` and pass it
  with `--runtime-config`, or set `ANTHROPIC_API_KEY` /
  `AGHAST_LOCAL_CLAUDE=true`.
- **SARIF exercise finds `0 targets`** (`07-cai-01`) — `sarifFile` is
  resolved relative to the **target repo**, not the config-dir. Point
  it at the SARIF that ships inside the scanned codebase.
