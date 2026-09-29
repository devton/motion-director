## motion-director.workflow.score

### Goal

Give the film a bespoke score and sound marks cut to the spine, normalized to broadcast-web loudness, with
sparse physical SFX.

### Scope

- Applies to: procedural scores (default) and licensed/public-domain recordings when the brief asks for one.
- Does not cover: voice-over (use `/media-use`), mixing footage audio.

### Triggers

- The `produce` chain, step 6; "add music", "the intro is too quiet", "cut the music to the picture".

### Inputs

- `assets/lib/layout.js` (times, requests for the typing schedule, counters).
- `DESIGN.md` register (bright/major vs serious/minor vs hand-made).

### Invariants

- The arrangement imports the spine; it never hard-codes a time that the spine owns.
- Deterministic (seeded) synthesis; the score is rebuilt by one command.
- Integrated loudness -16 LUFS ±1, true peak ≤ -1.5 dBTP; `loudnorm` with `LRA=20`, `linear=true`.
- SFX only on physical moments, low gain (0.1-0.3), licences kept.

### Procedure

1. Start from the arrangement of the story shape, copied to `scripts/synth-score.mjs` by the setup script:
   [../../scripts/score/arrangement.example.mjs](../../scripts/score/arrangement.example.mjs) (agent promo) or
   [../../scripts/score/arrangement.stage.example.mjs](../../scripts/score/arrangement.stage.example.mjs)
   (flow showcase); it imports `scripts/score-engine.mjs`.
2. Write the arrangement ([../../reference/audio-scoring.md](../../reference/audio-scoring.md)): harmony,
   energy map, the character's motif, the typing schedule, the per-event marks, the finale.
3. `bash scripts/build-score.sh` -> `assets/audio/score.wav`.
4. `bash scripts/qa/loudness.sh assets/audio/score.wav`; fix sags below about -25 dB in intros and hand-offs
   (bed pad, soft pulse, pickup fill); rebuild.
5. Add `<audio>` slots in `index.html`: the score (`data-start="0"`, full duration) and the SFX
   (`data-start`, `data-duration` from the file, `data-volume`), each on its own track index.

### Outputs

- `scripts/synth-score.mjs`, `assets/audio/score.wav`, `<audio>` slots, `assets/sfx/CREDITS.md`.

### Review gate

- [ ] Loudness within target; peak under -1 dBFS; no unintended per-second sag.
- [ ] Every hook slam, landing, answer, success and click in the storyboard has a mark at the spine time.
- [ ] The score rebuilds from one command with no network access.

### References

- [../../reference/audio-scoring.md](../../reference/audio-scoring.md) · [../../scripts/score/](../../scripts/score/)
