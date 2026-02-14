
#!/bin/bash
set -e
# Compute repository root two levels up from installers/mac
SCRIPT_DIR="$(cd "$(dirname "$0")"; pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.."; pwd)"
SRC="$REPO_ROOT/com.ae.discordrpc"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.ae.discordrpc"

echo "Installing to: $DEST"

if [ ! -d "$SRC" ]; then
  echo "Source folder not found: $SRC"
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R "$SRC" "$DEST"
chmod -R u+rwX "$DEST"
chmod +x "$DEST/installers/mac/install.command" 2>/dev/null || true

echo "Installation complete. Restart After Effects if running."
read -p "Press Enter to close..."
