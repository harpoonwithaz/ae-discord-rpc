# After Effects Discord Rich Presence

**CORRECTION:** This extension only works on only works for **After Effects 2020 and newer.** This is because the extension uses the CSXS 9 framework which is used by Node JS to connect to the discord client. I am working on a new version for older versions of after effects.

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
