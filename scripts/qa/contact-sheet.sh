#!/usr/bin/env bash
# Extract frames from a rendered video at the given times and tile them into one contact sheet (row-major,
# in the order given). Lightweight by design: a few dozen frames, scratch files deleted.
# usage: bash scripts/qa/contact-sheet.sh <video.mp4> <out.jpg> <columns> <t1> [t2 ...]
set -euo pipefail
export LC_ALL=C
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FF="${FFMPEG:-$ROOT/.bin/ffmpeg}"
[ -x "$FF" ] || FF=ffmpeg
IN="${1:?video}"
OUTJ="${2:?out.jpg}"
COLS="${3:?columns}"
shift 3
[ "$#" -gt 0 ] || { echo "give at least one time" >&2; exit 1; }
TMP="$(mktemp -d)"
i=0
for t in "$@"; do
  "$FF" -v error -y -ss "$t" -i "$IN" -frames:v 1 -vf "scale=480:-1" "$TMP/f_$(printf %03d "$i").png"
  echo "  [$i] ${t}s"
  i=$((i + 1))
done
ROWS=$(((i + COLS - 1) / COLS))
"$FF" -v error -y -framerate 1 -i "$TMP/f_%03d.png" \
  -filter_complex "tile=${COLS}x${ROWS}:padding=6:color=0x111111" -frames:v 1 -q:v 3 "$OUTJ"
rm -rf "$TMP"
echo "wrote $OUTJ ($i frames, ${COLS}x${ROWS})"
