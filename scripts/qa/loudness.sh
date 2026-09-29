#!/usr/bin/env bash
# Loudness report for a score or a rendered video: EBU R128 integrated loudness, loudness range and peak,
# then the RMS level of every second (spot sags: intros and hand-offs below about -25 dB).
# usage: bash scripts/qa/loudness.sh <file.wav|file.mp4>
set -euo pipefail
export LC_ALL=C
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FF="${FFMPEG:-$ROOT/.bin/ffmpeg}"
[ -x "$FF" ] || FF=ffmpeg
IN="${1:?file}"
echo "== EBU R128 (target: I -16 LUFS +-1, peak under -1 dBFS)"
"$FF" -hide_banner -nostats -i "$IN" -vn -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|LRA:|Peak:" || true
echo "== RMS per second (dB)"
"$FF" -hide_banner -nostats -i "$IN" -vn \
  -af "aresample=48000,asetnsamples=n=48000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" \
  -f null - 2>&1 | grep -o "RMS_level=[-0-9.a-z]*" | awk -F= '{ printf "%d:%s ", NR - 1, ($2 ~ /inf/ ? "-inf" : sprintf("%.0f", $2)) } END { print "" }'
