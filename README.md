# AE Discord RPC — Releases & Install

This repository produces simple ZIP-based installers for the After Effects CEP/Panel extension.

## Installation

- Download the appropriate ZIP for your OS from the GitHub Release (Windows or macOS).
- Extract the ZIP and run the installer in the `installers` folder:
  - Windows: Right-click `install.ps1` → Run with PowerShell
  - macOS: Double-click `install.command`
- The installer copies the extension into the per-user CEP extensions folder so no admin privileges are required.

## Troubleshooting

- If After Effects does not show the extension: restart After Effects; check the folder:
  - Windows: `%APPDATA%\Adobe\CEP\extensions\com.ae.discordrpc`
  - macOS: `~/Library/Application Support/Adobe/CEP/extensions/com.ae.discordrpc`
- Connection issues or failing to display status:
- Check `com.ae.discordrpc\discord-rpc-errors.log`
- To uninstall run the `uninstall.ps1` or `uninstall.sh` in the installers folder for your OS.
