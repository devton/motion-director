## motion-director.workflow.verify

### Goal

Prove the film is done: pass the gates, render it, inspect the MP4, deliver the poster and contact sheet,
and write the report.

### Scope

- Applies to: every delivery and every re-render after a fix.
- Does not cover: fixing what the gates find (route back to `build` or `score`, then return here).

### Triggers

- The `produce` chain, step 7; "check it", "render it", "is it ready?".

### Inputs

- The project folder; the brief (format, duration, name of the output).

### Invariants

- No delivery without `hyperframes check` passing with 0 errors; warnings resolved or justified.
- The rendered MP4 is inspected through extracted frames, never assumed from snapshots.
- Lightweight inspection: a few dozen frames, no all-frames dumps on long videos; scratch dumps deleted.
- The report states what was not verified.

### Procedure

1. G1-G3 of [../../reference/verification-gates.md](../../reference/verification-gates.md): lint, snapshots
   reviewed, `bash scripts/hf.sh check` (use `bash scripts/qa/check-summary.sh` to list findings).
2. G4: score loudness.
3. G5: `bash scripts/render.sh`; probe the MP4; `bash scripts/qa/contact-sheet.sh out/<name>.mp4 <times>`
   (first, last, both sides of every handoff, scene midpoints); `bash scripts/qa/loudness.sh out/<name>.mp4`.
4. Fix anything found (back to `build`/`score`), re-render, re-inspect the changed spans.
5. G6: poster (`ffmpeg -ss <t> -i out/<name>.mp4 -frames:v 1 out/<name>.png`), contact sheet from the MP4
   into `snapshots/contact-sheet.jpg`; storyboard statuses set to `rendered`.
6. G7: the report.

### Outputs

- `out/<name>.mp4`, `out/<name>.png`, `snapshots/contact-sheet.jpg`, the report.

### Review gate

- [ ] "Check passed", 0 errors; every remaining warning justified in the report.
- [ ] MP4: expected size, fps, duration, audio stream; first/last/handoff frames clean.
- [ ] Mix loudness within ±1 LU of -16, peak under -1 dBFS.
- [ ] Report complete (files, story, facts with sources, flags, decisions, verification, re-render commands).

### References

- [../../reference/verification-gates.md](../../reference/verification-gates.md) ·
  [../../reference/quality-bar.md](../../reference/quality-bar.md) · [../../scripts/qa/](../../scripts/qa/)
