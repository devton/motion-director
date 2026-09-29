#!/usr/bin/env bash
# Run the project's pinned HyperFrames CLI with the project-local FFmpeg/FFprobe on PATH.
# The pin lives in `.hf-version` at the project root (written by setup.sh), so renders stay reproducible.
# usage: bash scripts/hf.sh <hyperframes args...>
set -euo pipefail
export LC_ALL=C
cd "$(dirname "$0")/.."
PIN="$(cat .hf-version 2>/dev/null || echo 0.8.85)"
mkdir -p .bin
ln -sf "$PWD/node_modules/ffmpeg-static/ffmpeg" .bin/ffmpeg
PROBE="$(ls -d "$PWD"/node_modules/@ffprobe-installer/*/ffprobe 2>/dev/null | grep -v '/ffprobe/ffprobe$' | head -1 || true)"
if [ -n "$PROBE" ]; then
  chmod +x "$PROBE" && ln -sf "$PROBE" .bin/ffprobe
fi
export PATH="$PWD/.bin:$PATH"
exec bun x "hyperframes@${PIN}" "$@"
