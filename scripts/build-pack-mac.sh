#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
repo_root="$(cd "$script_dir/.." &>/dev/null && pwd)"
ext_dir="$repo_root/com.ae.discordrpc"
build_dir="$repo_root/build"
tmp_ext_bundle="$build_dir/extension_bundle"

# Clean
rm -rf "$build_dir"
mkdir -p "$tmp_ext_bundle"

# Read version from package.json
pkg_json_path="$ext_dir/package.json"
if [[ ! -f "$pkg_json_path" ]]; then
  echo "package.json not found at $pkg_json_path"
  exit 1
fi
version=$(jq -r .version "$pkg_json_path")
if [[ -z "$version" ]]; then
  echo "version not defined in package.json"
  exit 1
fi

# Install production deps deterministically
pushd "$ext_dir" > /dev/null
npm ci --production
# Optional patch script if present
patch_script="$ext_dir/scripts/patch-discord-rpc.js"
if [[ -f "$patch_script" ]]; then
  node "$patch_script"
fi
popd > /dev/null

# Copy extension folder into bundle
target_ext_dir="$tmp_ext_bundle/com.ae.discordrpc"
mkdir -p "$target_ext_dir"
cp -r "$ext_dir"/* "$target_ext_dir"

# Create output directory
mkdir -p "$build_dir"

# Create macOS zip
mac_zip="$build_dir/com.ae.discordrpc-mac-v${version}.zip"
zip -r "$mac_zip" "$tmp_ext_bundle"/*

echo "Build complete."
echo "macOS ZIP: $mac_zip"