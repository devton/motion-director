#!/usr/bin/env bash
# Prepare a freshly scaffolded HyperFrames project for the motion-director workflow:
#   - pins the HyperFrames CLI version (.hf-version) and wires scripts/hf.sh, render.sh, build-score.sh;
#   - adds local ffmpeg/ffprobe (devDependencies) and vendors GSAP + plugins into assets/vendor/;
#   - copies the QA scripts, the score engine + the arrangement template and the spine of the chosen story shape
#     (agent: chat-driven co-pilot promo; stage: flow showcase on the head-on 3D stage), and the shared libs.
# Files the project already has are kept (never overwritten).
# usage: bash <skill>/scripts/project/setup.sh <projectDir> [hyperframesVersion] [agent|stage]
set -euo pipefail
export LC_ALL=C
SKILL="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="${1:?usage: setup.sh <projectDir> [hyperframesVersion] [agent|stage]}"
PIN="${2:-0.8.85}"
SHAPE="${3:-agent}"
case "$SHAPE" in agent | stage) ;; *) echo "shape must be agent or stage, got: $SHAPE" >&2; exit 1 ;; esac
cd "$DIR"
[ -f package.json ] || { echo "no package.json in $DIR: run 'bun x hyperframes@<pin> init' first" >&2; exit 1; }

mkdir -p scripts/qa assets/lib assets/vendor assets/audio assets/sfx out
[ -f .hf-version ] || echo "$PIN" > .hf-version

cp_new() { if [ -e "$2" ]; then echo "keep $2"; else cp "$1" "$2"; echo "add  $2"; fi; }
for f in hf.sh render.sh build-score.sh; do cp_new "$SKILL/scripts/project/$f" "scripts/$f"; done
for f in contact-sheet.sh loudness.sh check-summary.sh; do cp_new "$SKILL/scripts/qa/$f" "scripts/qa/$f"; done
cp_new "$SKILL/scripts/score/score-engine.mjs" scripts/score-engine.mjs
if [ "$SHAPE" = stage ]; then
  cp_new "$SKILL/scripts/score/arrangement.stage.example.mjs" scripts/synth-score.mjs
  cp_new "$SKILL/templates/lib/layout-stage.js" assets/lib/layout.js
else
  cp_new "$SKILL/scripts/score/arrangement.example.mjs" scripts/synth-score.mjs
  cp_new "$SKILL/templates/lib/layout.js" assets/lib/layout.js
fi
for f in hw.js ui.js camera.js board.js; do cp_new "$SKILL/templates/lib/$f" "assets/lib/$f"; done

# package.json: bun scripts, local ffmpeg/ffprobe, trusted install scripts, ESM
bun -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.type = p.type || "module";
p.scripts = Object.assign({}, p.scripts, {
  dev: "bash scripts/hf.sh preview",
  check: "bash scripts/hf.sh check",
  render: "bash scripts/render.sh",
  score: "bash scripts/build-score.sh",
});
const trusted = new Set([...(p.trustedDependencies || []), "ffmpeg-static", "@ffprobe-installer/ffprobe",
  "@ffprobe-installer/darwin-arm64", "@ffprobe-installer/darwin-x64", "@ffprobe-installer/linux-x64"]);
p.trustedDependencies = [...trusted];
p.devDependencies = Object.assign({}, p.devDependencies, {
  "@ffprobe-installer/ffprobe": "^2.1.2",
  "ffmpeg-static": "^5.3.0",
  gsap: "^3.13.0",
});
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
'
bun install

# vendor GSAP so renders never touch the network
for f in gsap.min.js CustomEase.min.js MotionPathPlugin.min.js DrawSVGPlugin.min.js; do
  cp_new "node_modules/gsap/dist/$f" "assets/vendor/$f"
done

bash scripts/hf.sh --version >/dev/null 2>&1 || true # creates .bin/ffmpeg and .bin/ffprobe
echo "ready ($SHAPE): $(cat .hf-version) · $(ls scripts | tr '\n' ' ')"
if [ "$SHAPE" = stage ]; then
  echo "start from: $SKILL/templates/index.stage.example.html + compositions/{bg,title,stage-3d,stage-hud,finale}.html"
else
  echo "start from: $SKILL/templates/index.example.html + compositions/{bg,hook,chat,tracker,surface,finale}.html"
fi
