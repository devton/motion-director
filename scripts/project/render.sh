#!/usr/bin/env bash
# Render the delivery master, then encode the shareable H.264 (CRF 18, faststart) and delete the master.
# usage: bash scripts/render.sh [output.mp4]   (default: out/<project-folder-name>.mp4)
set -euo pipefail
export LC_ALL=C
cd "$(dirname "$0")/.."
OUT="${1:-out/$(basename "$PWD").mp4}"
mkdir -p renders "$(dirname "$OUT")"
bash scripts/hf.sh render --quality delivery --output renders/master.mp4
.bin/ffmpeg -hide_banner -loglevel error -y -i renders/master.mp4 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a copy "$OUT"
rm -f renders/master.mp4
echo "wrote $OUT"
