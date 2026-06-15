#!/usr/bin/env pwsh
# Runs Semgrep against this repo with the auto-selected registry ruleset.
# Outputs SARIF (for GitHub code scanning / VS Code SARIF Viewer), a plain-text
# report, and a self-contained HTML report. Disables telemetry crashes via UTF-8.

param(
    [string]$Output = "semgrep.sarif",
    [string]$TextOutput,
    [string]$HtmlOutput
)

$ErrorActionPreference = "Stop"

# Derive sibling report names from the SARIF path unless explicitly overridden.
$base = [System.IO.Path]::Combine(
    [System.IO.Path]::GetDirectoryName($Output),
    [System.IO.Path]::GetFileNameWithoutExtension($Output))
if (-not $TextOutput) { $TextOutput = "$base.txt" }
if (-not $HtmlOutput) { $HtmlOutput = "$base.html" }

# Force Python/Semgrep to write UTF-8. Without this, Windows uses cp1252 and
# crashes when a rule message contains characters like emoji (UnicodeEncodeError).
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

# The per-format --*-output flags each "write a copy" of that format and can be
# combined in a single scan, so we get SARIF + text from one run.
# Note: --config auto requires metrics enabled; Semgrep refuses "auto" with metrics off.
$args = @("--config", "auto", "--sarif-output", $Output, "--text-output", $TextOutput)

Write-Host "Running: semgrep scan $($args -join ' ')" -ForegroundColor Cyan
& semgrep scan @args
$semgrepExit = $LASTEXITCODE

# --- Build the HTML report from the SARIF output (Semgrep has no native HTML). ---
# Best-effort: a failure here must not mask the scan result.
function ConvertTo-HtmlText($s) {
    if ($null -eq $s) { return "" }
    return ([string]$s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;')
}

try {
    if (Test-Path $Output) {
        $sarif = Get-Content $Output -Raw | ConvertFrom-Json
        $results = @($sarif.runs[0].results)

        $rows = foreach ($r in $results) {
            $phys = $r.locations[0].physicalLocation
            $file = $phys.artifactLocation.uri
            $line = $phys.region.startLine
            $level = if ($r.level) { $r.level } else { "note" }
            "<tr class='sev-$level'>" +
            "<td class='loc'>$(ConvertTo-HtmlText $file):$line</td>" +
            "<td>$(ConvertTo-HtmlText $r.ruleId)</td>" +
            "<td>$(ConvertTo-HtmlText $level)</td>" +
            "<td>$(ConvertTo-HtmlText $r.message.text)</td></tr>"
        }
        if (-not $rows) { $rows = "<tr><td colspan='4'>No findings.</td></tr>" }

        $html = @"
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Semgrep report</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#1a1a1a}
 h1{font-size:1.3rem} .meta{color:#666;margin-bottom:1rem}
 table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:.4rem .6rem;text-align:left;vertical-align:top}
 th{background:#f5f5f5} td.loc{white-space:nowrap;font-family:ui-monospace,monospace}
 tr.sev-error{background:#fdecea} tr.sev-warning{background:#fff6e5} tr.sev-note{background:#eef6ff}
</style></head><body>
<h1>Semgrep report</h1>
<p class="meta">$($results.Count) finding(s) &middot; generated $(Get-Date -Format 'yyyy-MM-dd HH:mm')</p>
<table><thead><tr><th>Location</th><th>Rule</th><th>Severity</th><th>Message</th></tr></thead>
<tbody>
$($rows -join "`n")
</tbody></table>
</body></html>
"@
        Set-Content -Path $HtmlOutput -Value $html -Encoding UTF8
        Write-Host "HTML written to $HtmlOutput" -ForegroundColor Green
    } else {
        Write-Host "Skipping HTML report: $Output not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Skipping HTML report: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($semgrepExit -eq 0) {
    Write-Host "SARIF written to $Output" -ForegroundColor Green
    Write-Host "Text report written to $TextOutput" -ForegroundColor Green
} else {
    Write-Host "Semgrep exited with code $semgrepExit" -ForegroundColor Yellow
}
