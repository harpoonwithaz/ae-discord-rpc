param(
    [string]$SourceFolder = $null
)

# Determine repo root (two levels up from this script) unless overridden
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $SourceFolder) {
    $repoRoot = Resolve-Path (Join-Path $scriptDir '..\..') | Select-Object -ExpandProperty Path
    $Source = Join-Path $repoRoot 'com.ae.discordrpc'
} else {
    $Source = $SourceFolder
}
$Dest = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.ae.discordrpc'

Write-Host "Installing extension to $Dest"

if (-not (Test-Path -Path $Source)) {
    Write-Host "Source folder not found: $Source" -ForegroundColor Red
    exit 1
}

if (Test-Path $Dest) {
    Remove-Item -Path $Dest -Recurse -Force
}

New-Item -ItemType Directory -Path $Dest -Force | Out-Null
Copy-Item -Path (Join-Path $Source '*') -Destination $Dest -Recurse -Force

Write-Host "Installation complete. Restart After Effects if it's running."
