#!/usr/bin/env bash
# Runs Semgrep against this repo with the auto-selected registry ruleset.
# Outputs SARIF (for GitHub code scanning / VS Code SARIF Viewer), a plain-text
# report, and a self-contained HTML report. Disables telemetry crashes via UTF-8.

set -euo pipefail

OUTPUT="${1:-semgrep.sarif}"
TEXT_OUTPUT="${2:-${OUTPUT%.*}.txt}"
HTML_OUTPUT="${3:-${OUTPUT%.*}.html}"

# Force Python/Semgrep to write UTF-8 so rule messages with non-ASCII
# characters (e.g. emoji) don't trigger a UnicodeEncodeError.
export PYTHONUTF8=1
export PYTHONIOENCODING=utf-8

# The per-format --*-output flags each "write a copy" of that format and can be
# combined in a single scan, so we get SARIF + text from one run.
# Note: --config auto requires metrics enabled; Semgrep refuses "auto" with metrics off.
args=(--config auto --sarif-output "$OUTPUT" --text-output "$TEXT_OUTPUT")

echo "Running: semgrep scan ${args[*]}"

set +e
semgrep scan "${args[@]}"
status=$?
set -e

# --- Build the HTML report from the SARIF output (Semgrep has no native HTML). ---
# Best-effort: needs a Python interpreter, which isn't guaranteed to be on PATH.
PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then
    echo "Skipping HTML report: no python interpreter found on PATH"
elif [ ! -f "$OUTPUT" ]; then
    echo "Skipping HTML report: $OUTPUT not found"
else
    if "$PY" - "$OUTPUT" "$HTML_OUTPUT" <<'PYEOF'
import datetime, html, json, sys

sarif_path, html_path = sys.argv[1], sys.argv[2]
with open(sarif_path, encoding="utf-8") as f:
    sarif = json.load(f)

results = (sarif.get("runs") or [{}])[0].get("results", [])
rows = []
for r in results:
    phys = ((r.get("locations") or [{}])[0]).get("physicalLocation", {})
    loc = phys.get("artifactLocation", {}).get("uri", "")
    line = phys.get("region", {}).get("startLine", "")
    level = r.get("level") or "note"
    rows.append(
        "<tr class='sev-{lv}'><td class='loc'>{loc}:{line}</td>"
        "<td>{rule}</td><td>{lv}</td><td>{msg}</td></tr>".format(
            lv=html.escape(level),
            loc=html.escape(str(loc)),
            line=html.escape(str(line)),
            rule=html.escape(str(r.get("ruleId", ""))),
            msg=html.escape(str(r.get("message", {}).get("text", ""))),
        )
    )
if not rows:
    rows = ["<tr><td colspan='4'>No findings.</td></tr>"]

doc = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Semgrep report</title>
<style>
 body{{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#1a1a1a}}
 h1{{font-size:1.3rem}} .meta{{color:#666;margin-bottom:1rem}}
 table{{border-collapse:collapse;width:100%}} th,td{{border:1px solid #ddd;padding:.4rem .6rem;text-align:left;vertical-align:top}}
 th{{background:#f5f5f5}} td.loc{{white-space:nowrap;font-family:ui-monospace,monospace}}
 tr.sev-error{{background:#fdecea}} tr.sev-warning{{background:#fff6e5}} tr.sev-note{{background:#eef6ff}}
</style></head><body>
<h1>Semgrep report</h1>
<p class="meta">{count} finding(s) &middot; generated {ts}</p>
<table><thead><tr><th>Location</th><th>Rule</th><th>Severity</th><th>Message</th></tr></thead>
<tbody>
{rows}
</tbody></table>
</body></html>
""".format(count=len(results), ts=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), rows="\n".join(rows))

with open(html_path, "w", encoding="utf-8") as f:
    f.write(doc)
PYEOF
    then
        echo "HTML written to $HTML_OUTPUT"
    else
        echo "Skipping HTML report: failed to render from $OUTPUT"
    fi
fi

if [ "$status" -eq 0 ]; then
    echo "SARIF written to $OUTPUT"
    echo "Text report written to $TEXT_OUTPUT"
else
    echo "Semgrep exited with code $status"
fi
