$Dest = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.ae.discordrpc'
if (Test-Path $Dest) {
    Remove-Item -Path $Dest -Recurse -Force
    Write-Host "Extension removed from $Dest"
} else {
    Write-Host "Extension not found at $Dest"
}
