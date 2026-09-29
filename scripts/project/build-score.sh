#!/usr/bin/env bash
# Synthesize the score (scripts/synth-score.mjs, keyed to assets/lib/layout.js) and loudness-normalize it to
# -16 LUFS / -1.5 dBTP with a two-pass linear loudnorm -> assets/audio/score.wav.
# LRA=20 keeps loudnorm in linear mode (a target LRA below the measured one silently falls back to dynamic).
# usage: bash scripts/build-score.sh
set -euo pipefail
export LC_ALL=C
cd "$(dirname "$0")/.."
mkdir -p assets/audio
RAW="$(mktemp -d)/score-raw.wav"
bun scripts/synth-score.mjs "$RAW" >/dev/null
bash scripts/hf.sh --version >/dev/null 2>&1 || true # makes sure .bin/ffmpeg exists
M="$(.bin/ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-16:TP=-1.5:LRA=20:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')"
get() { echo "$M" | sed -n "s/.*\"$1\" : \"\\([^\"]*\\)\".*/\\1/p"; }
AF="loudnorm=I=-16:TP=-1.5:LRA=20:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000"
.bin/ffmpeg -hide_banner -loglevel error -y -i "$RAW" -af "$AF" -c:a pcm_s16le assets/audio/score.wav
rm -f "$RAW"
echo "wrote assets/audio/score.wav"
