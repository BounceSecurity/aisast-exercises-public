# AGHAST hands-on exercises

Hands-on exercises that teach how to write security checks for
[AGHAST](https://github.com/BounceSecurity/aghast). Each exercise
ships with a vulnerable target codebase. The exercises build up from "one Semgrep pattern, no AI"
to "Semgrep finds candidates, AI judges each one".

## How the exercises are structured

Each exercise is a self-contained folder:

```
NN-xxx-YYY-walkthrough/   ← guided, step-by-step
  README.md               ← instructions and explanation
  target/                 ← vulnerable codebase you scan

NN-xxx-YYY-exercise-stretch/  ← goal only, no walkthrough
  README.md               ← goal, constraints, hints
  target/
```

- **Walkthrough** exercises are for the first time you meet that kind of check.
  They walk you through writing the check from scratch and explain every decision.
- **Stretch** exercises use a different problem of the same type. You only get
  the goal, constraints, and a few hints.

## The exercises

Take them in order — each one assumes the previous one's vocabulary.

| Walkthrough | Stretch | What it teaches | Tools used |
|---|---|---|---|
| `05-cli-02-walkthrough` | `05-cli-03-exercise-stretch` | One AST pattern, metavariables, `metavariable-regex`. The shape of an AGHAST `static` check. | Semgrep only |
| `05-cli-04-walkthrough` | `05-cli-05-exercise-stretch` | Sources / sinks / sanitizers, `focus-metavariable`, intra-file taint flow. | Semgrep only |
| `06-bai-01-exercise-walkthrough` | `06-bai-02-exercise-stretch` | The shape of a `repository` check. Writing a clear, concrete markdown prompt. | Claude (no Semgrep) |
| `06-bai-03-exercise-walkthrough` | `06-bai-04-exercise-stretch` | Cross-file reasoning. Naming sinks, sensitive fields, safe vs unsafe transforms. | Claude (no Semgrep) |

## Prerequisites

| Need | Used by | How to install |
|---|---|---|
| Node.js ≥ 20 | All | https://nodejs.org/ |
| Git | All | targets are scanned as git repositories |
| Semgrep | `05-cli-*` | `pip install semgrep` (Linux/macOS preferred — see Windows note below) |
| Anthropic API key | `06-bai-*` | set `ANTHROPIC_API_KEY=...` **or** `AGHAST_LOCAL_CLAUDE=true` to use the local Claude CLI |

Run `git status` inside any `target/` folder before you scan it — the
exercise targets must be git repos so AGHAST can attach repo metadata
and Semgrep can scope to tracked files. If a target lacks a `.git/`
folder (e.g. you copied it elsewhere), initialise it once:

```bash
cd path/to/target
git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -q -m init
```

### Windows note

Semgrep `mode: join` is unreliable on Windows because the engine uses
`socketpair()`, which the OS sometimes blocks. The `05-cli-04` taint
exercises use `mode: taint` which works everywhere. The walkthrough README
has the join-mode equivalent in an appendix for completeness.

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
