# After Effects Discord Rich Presence

![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/harpoonwithaz/ae-discord-rpc)

**FIXED ISSUES** for windows. Please update to the [latest release](https://github.com/harpoonwithaz/ae-discord-rpc/releases/latest/download/com.ae.discordrpc-windows.zip).
Diff: https://github.com/harpoonwithaz/ae-discord-rpc/pull/8

**Full Changelog**: https://github.com/harpoonwithaz/ae-discord-rpc/compare/v1.0.6...v2.0.0


## Download

- Windows: [Latest Release](https://github.com/harpoonwithaz/ae-discord-rpc/releases/latest/download/com.ae.discordrpc-windows.zip)
- macOS: [Latest Release](https://github.com/harpoonwithaz/ae-discord-rpc/releases/latest/download/com.ae.discordrpc-windows.zip)

## Installation

- Download the appropriate ZIP for your OS from the GitHub Release (Windows or macOS).
- Extract the ZIP and open it.
- Move `com.ae.discordrpc` to:
  - Windows: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
  - macOS: `~/Library/Application Support/Adobe/CEP/extensions/`
- Reopen After Effects.

## Troubleshooting

- If After Effects does not show the extension: restart After Effects; on window, check registry:
  - `Computer\HKEY_CURRENT_USER\Software\Adobe\CSXS.8\PlayerDebugMode` is set to type `REG_SZ` with value `1`.
- Connection issues or failing to display status:
- Check `com.ae.discordrpc\bin\bridge_errors.log`
