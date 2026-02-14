#!/bin/bash
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.ae.discordrpc"
if [ -d "$DEST" ]; then
  rm -rf "$DEST"
  echo "Removed $DEST"
else
  echo "Not found: $DEST"
fi
