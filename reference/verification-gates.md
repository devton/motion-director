# Verification gates

The definition of done. Run in this order; each gate has a pass condition. Scripts:
[../scripts/qa/](../scripts/qa/).

## G1 - Lint (after every structural change)

`bash scripts/hf.sh lint` -> 0 errors. File-size warnings are acceptable for big stage compositions.

## G2 - Snapshots (after the first full pass and after every visual fix)

`bash scripts/hf.sh snapshot --at <times> --no-end --describe false --timeout 20000`

Pick times deliberately: 0.1 s after the first beat, every slam, both sides of every handoff, every
scene's midpoint, the peak of every flight, the frame before and after each cut, and the last frame.
Review the contact sheets for:

- blank or near-blank frames (a panel opening empty, a transition that shows nothing);
- stray elements (a dot at the frame centre, a parked element's shadow on an edge);
- text clipped by its container, text over text, text on a low-contrast ground;
- overflows (a chip row running off the right edge);
- cards not head-on, props over UI, HUD over content;
- motion blur over text that must be read;
- the right state at the right time (counters, statuses, checks).

Zoom a single frame (`ffmpeg ... -vf crop=...`) when something is ambiguous at contact-sheet size.

## G3 - Check (before render)

`bash scripts/hf.sh check` -> "Check passed" with 0 errors. Resolve warnings: layout overlaps (mark
intentional stacks, hide clipped content), contrast (darken muted text on grey grounds, hide what scrolled
out), motion. A remaining warning must be intentional and written into the report with its reason.
`bash scripts/qa/check-summary.sh` prints only the findings.

## G4 - Sound

`bash scripts/build-score.sh` then `bash scripts/qa/loudness.sh assets/audio/score.wav`: integrated -16 LUFS ±1, no
unintended per-second RMS sag below about -25 dB.

## G5 - Render and inspect the MP4

`bash scripts/render.sh` (master, then a CRF 18 share copy with faststart).

- Probe: 1920x1080 (or the brief's aspect), the brief's fps, duration to the frame, an audio stream.
- `bash scripts/qa/contact-sheet.sh out/<name>.mp4 <sheet.jpg> <columns> <times...>`: first frame, last frame, both sides of every handoff,
  every scene midpoint. Motion bugs (reverts at t = 0, frozen renderers, leaks at the edges, blur) only
  show here.
- `bash scripts/qa/loudness.sh out/<name>.mp4`: the mix with SFX stays within ±1 LU of -16 and under -1 dBFS peak.
- Keep it lightweight: a few dozen frames, never an all-frames dump on long videos.

## G6 - Deliverables

- `out/<name>.mp4` (share copy), `out/<name>.png` (poster: the final frame or the most selling frame),
  `snapshots/contact-sheet.jpg` (from the MP4).
- Project docs updated: `STORYBOARD.md` frame statuses, `BRIEF.md` notes (decisions and caveats).

## G7 - Report

Write it for someone who never saw the request:

1. What was made (length, format, language) and where each file lives.
2. The story in 3-5 beats.
3. Facts the video relies on, with their sources; flags raised (name collisions, product limits, launches).
4. Decisions taken autonomously and the alternatives left behind.
5. Verification: the gates run and their results (check verdict, loudness numbers), and what was not
   verified (sound not listened to, a device not tested).
6. How to re-render (`bash scripts/render.sh`) and re-score (`bash scripts/build-score.sh`).
