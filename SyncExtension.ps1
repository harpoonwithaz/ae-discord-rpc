# Define Paths
$Source = "C:\Users\Oliver\Documents\Coding\ae-discord-rpc\com.ae.discordrpc"
$Destination = "C:\Users\Oliver\AppData\Roaming\Adobe\CEP\extensions\com.ae.discordrpc"

if (Test-Path -Path $Destination) {
    Remove-Item -Path $Destination -Recurse -Force
}

Copy-Item -Path $Source -Destination $Destination -Recurse -Force

Write-Host "Sync Complete: Destination refreshed."