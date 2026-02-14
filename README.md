# AE Discord RPC — Releases & Install

This repository produces simple ZIP-based installers for the After Effects CEP/Panel extension.

## Installation

  - Windows: Right-click `install.ps1` → Run with PowerShell
  - macOS: Double-click `install.command`

## Troubleshooting

  - Windows: `%APPDATA%\Adobe\CEP\extensions\com.ae.discordrpc`
  - macOS: `~/Library/Application Support/Adobe/CEP/extensions/com.ae.discordrpc`
# AE Discord RPC — Releases & Install

This repository contains the After Effects CEP extension `com.ae.discordrpc` used for Discord Rich Presence.

## Installation (manual)

- Copy the `com.ae.discordrpc` folder into the per-user CEP extensions folder for your OS:
  - Windows (per-user): `%APPDATA%\Adobe\CEP\extensions\`
  - macOS (per-user): `~/Library/Application Support/Adobe/CEP/extensions/`
- After copying, restart After Effects if it was running.
- To uninstall, delete the `com.ae.discordrpc` folder from the same location.

## Troubleshooting

- Confirm the folder exists at the paths above and that the folder name is exactly `com.ae.discordrpc`.
- If the extension does not appear: restart After Effects and check the CEP/Extensions preferences.
- Check `com.ae.discordrpc\discord-rpc-errors.log` inside the extension folder for runtime errors.

## Creating a new release

1. Update the version and changelog in `com.ae.discordrpc/package.json` and commit the change.
2. Push your branch and open a pull request (if required by your workflow).
3. From the repository root, run the packaging script to prepare artifacts:

```powershell
.\scripts\build-pack.ps1
```

4. Create ZIP artifacts of the packaged extension (example — adjust version and paths):

```powershell
# adjust X.Y.Z to the new version
Compress-Archive -Path build\extension_bundle\com.ae.discordrpc\* -DestinationPath build\com.ae.discordrpc-vX.Y.Z-win.zip -Force
```

5. Tag the release and push the tag:

```powershell
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

6. Create a GitHub Release and upload the ZIP artifacts (use the web UI or the `gh` CLI):

```powershell
gh release create vX.Y.Z build\com.ae.discordrpc-vX.Y.Z-win.zip --title "vX.Y.Z" --notes "Release notes"
```

7. Verify the release on GitHub and that the ZIP contains the `com.ae.discordrpc` folder ready for users to download and manually copy into their CEP extensions folder.

If you want, I can add a small `RELEASE.md` with these commands or add a `build` target to automatically zip and tag.
