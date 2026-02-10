# Define Paths
$Source = "C:\Users\Oliver\Documents\Coding\ae-discord-rpc\com.ae.discordrpc"
$Destination = "C:\Users\Oliver\AppData\Roaming\Adobe\CEP\extensions\com.ae.discordrpc"

# 1. Remove the existing destination folder if it exists
if (Test-Path -Path $Destination) {
    Remove-Item -Path $Destination -Recurse -Force
}

# 2. Copy the source folder to the destination
Copy-Item -Path $Source -Destination $Destination -Recurse -Force

Write-Host "Sync Complete: Destination refreshed."