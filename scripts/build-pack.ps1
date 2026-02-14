# Build + package extension zips on Windows 11
# Usage: Open PowerShell (run as normal user), cd to repo root, then:
#   .\scripts\build-pack-windows.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir '..') | Select-Object -ExpandProperty Path
$extDir = Join-Path $repoRoot 'com.ae.discordrpc'
$buildDir = Join-Path $repoRoot 'build'
$tmpExtBundle = Join-Path $buildDir 'extension_bundle'

# Clean
if (Test-Path $buildDir) { Remove-Item $buildDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpExtBundle -Force | Out-Null

# Read version from package.json
$pkgJsonPath = Join-Path $extDir 'package.json'
if (-not (Test-Path $pkgJsonPath)) { throw "package.json not found at $pkgJsonPath" }
$pkg = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
$version = $pkg.version
if (-not $version) { throw "version not defined in package.json" }

# Install production deps deterministically
Push-Location $extDir
Write-Host "Running npm ci in $extDir ..."
npm ci --production
# Optional patch script if present
$patchScript = Join-Path $extDir 'scripts\patch-discord-rpc.js'
if (Test-Path $patchScript) {
    Write-Host "Running patch script..."
    node $patchScript
}
Pop-Location

# Copy extension folder into bundle
$targetExtDir = Join-Path $tmpExtBundle 'com.ae.discordrpc'
Write-Host "Copying extension files to $targetExtDir ..."

# Ensure target is a clean directory (remove file or folder if present)
if (Test-Path $targetExtDir) {
    $item = Get-Item $targetExtDir -Force
    if ($item.PSIsContainer) {
        Remove-Item -Path $targetExtDir -Recurse -Force
    } else {
        Remove-Item -Path $targetExtDir -Force
    }
}
New-Item -ItemType Directory -Path $targetExtDir -Force | Out-Null

Copy-Item -Path (Join-Path $extDir '*') -Destination $targetExtDir -Recurse -Force

# Also copy installers so they are included in zips (if present)
$installersSrc = Join-Path $repoRoot 'installers'
if (Test-Path $installersSrc) {
    Copy-Item -Path $installersSrc -Destination (Join-Path $tmpExtBundle 'installers') -Recurse -Force
}

# Create output directory
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

# Create Windows zip
$winZip = Join-Path $buildDir ("com.ae.discordrpc-windows-v{0}.zip" -f $version)
Write-Host "Creating Windows ZIP: $winZip"
Compress-Archive -Path (Join-Path $tmpExtBundle '*') -DestinationPath $winZip -Force

# Create Mac zip (same content; mac will need executable bit set by user after extracting if required)
$macZip = Join-Path $buildDir ("com.ae.discordrpc-mac-v{0}.zip" -f $version)
Write-Host "Creating macOS ZIP: $macZip"
Compress-Archive -Path (Join-Path $tmpExtBundle '*') -DestinationPath $macZip -Force

# Compute SHA256 checksums
$winHash = Get-FileHash -Path $winZip -Algorithm SHA256
$macHash = Get-FileHash -Path $macZip -Algorithm SHA256

Write-Host "Build complete."
Write-Host "Windows ZIP: $winZip"
Write-Host "SHA256: $($winHash.Hash)"
Write-Host "macOS ZIP: $macZip"
Write-Host "SHA256: $($macHash.Hash)"

# Optional: print short release note template
Write-Host ""
Write-Host "Release artifacts ready. Suggested Git commit/tag:"
Write-Host "  git add -A && git commit -m 'chore(release): v$version' && git push origin main"
Write-Host "  git tag -a v$version -m 'Release v$version' && git push origin v$version"