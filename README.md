# After Effects Discord Rich Presence

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
  - `Computer\HKEY_CURRENT_USER\Software\Adobe\CSXS.9\PlayerDebugMode` is set to type `REG_SZ` with value `1`.
- Connection issues or failing to display status:
- Check `com.ae.discordrpc\discord-rpc-errors.log`
