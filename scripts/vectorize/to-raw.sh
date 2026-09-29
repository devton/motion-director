#!/usr/bin/env bash
# Decode an image to raw RGB24 for the vectorize scripts and print its size as "W H".
# usage: bash to-raw.sh <image> <out.rgb>        (FFMPEG=/path/to/ffmpeg to pick a binary)
set -euo pipefail
export LC_ALL=C
FF="${FFMPEG:-ffmpeg}"
"$FF" -v error -y -i "${1:?image}" -f rawvideo -pix_fmt rgb24 "${2:?out.rgb}"
"$FF" -hide_banner -i "$1" 2>&1 | grep -o "[0-9]\{2,5\}x[0-9]\{2,5\}" | head -1 | tr x ' ' || true # ffmpeg exits 1 without an output file; only the size line matters
