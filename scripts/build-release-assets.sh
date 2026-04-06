#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-release}"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
: > "$OUTPUT_DIR/checksums.txt"

targets=(
  "bun-darwin-arm64 darwin arm64"
  "bun-darwin-x64 darwin x64"
  "bun-linux-arm64 linux arm64"
  "bun-linux-x64 linux x64"
)

for target in "${targets[@]}"; do
  read -r bun_target os arch <<<"$target"

  asset_name="claudex-switch-${os}-${arch}"
  work_dir="$OUTPUT_DIR/$asset_name"
  archive_path="$OUTPUT_DIR/${asset_name}.tar.gz"

  mkdir -p "$work_dir"

  bun build ./src/index.ts --compile --target="$bun_target" --outfile="$work_dir/claudex-switch"
  tar -C "$work_dir" -czf "$archive_path" claudex-switch
  shasum -a 256 "$archive_path" >> "$OUTPUT_DIR/checksums.txt"

  rm -rf "$work_dir"
done
