# Audio: procedural score cut to picture

A bespoke, dependency-free score synthesized from the spine, plus a few bundled SFX on physical moments.
Engine: [../scripts/score/score-engine.mjs](../scripts/score/score-engine.mjs); arrangement templates:
[../scripts/score/arrangement.example.mjs](../scripts/score/arrangement.example.mjs) (agent promo, bright major) and
[../scripts/score/arrangement.stage.example.mjs](../scripts/score/arrangement.stage.example.mjs) (flow showcase,
calm minor: a hit per ghost, card, run step, signal and ring); normalization:
[../scripts/project/build-score.sh](../scripts/project/build-score.sh).

## Why procedural

- Every mark lands on its frame because the arrangement imports the same spine as the compositions.
- Deterministic (seeded noise), license-free, re-renders in seconds (`bun` runs 40 s of stereo 48 kHz in
  ~3 s), and re-times itself when the spine changes.

## The engine (voices and buses)

- Drums: `kick`, `clap`, `hat` (closed/open), `tick`, `woodClick`, `thock` (a landing thump), `key` (a
  keyboard key).
- Tonal: `sub` (bass), `pluck` (detuned saws through a filter envelope), `bell` (FM), `marimba`, `pad`
  (detuned saws, LFO filter, wide).
- FX: `blip` (pitched UI blip), `easeGlide` (a sine glide whose pitch follows an easing: you hear the ease),
  `riser`, `whoosh` (panned air), `reverseSwell` (the suck into a hit), `impact`, `whir` (thinking).
- Buses: drums, bass, music, FX, reverb send (Freeverb), delay send (ping-pong 3/16 at 120 BPM); a kick
  sidechain ducks bass and (lighter) music; master high-pass 30 Hz, soft saturation, peak normalize, a
  4 ms fade-in and a 0.45 s fade-out.

## Arrangement recipe

1. **Key and register:** major and bright (I-V-vi-IV) for friendly products; minor (i-VI-III-VII) for
   serious/technical ones; a warm pentatonic mallet palette for hand-made registers. 120 BPM.
2. **Energy map:** light groove (kick on 1 and 3, soft hats) while the agent introduces itself and the first
   ask types; normal groove (claps on 2 and 4, arpeggio) after the first success; full groove (four on the
   floor, walking sub) for the busiest stretch; drums out for the dive; a big chord for the mark.
3. **A signature motif** for the character: two bells a 5th apart (e.g. D5 -> A5), on its hello, every
   answer and the close.
4. **Marks keyed to the spine:**
   - a key tick per typed character (replicate the composer's exact schedule);
   - send = short whoosh + rising blip; dots = three soft blips; thinking = a whir over the think window;
   - builds = a thock; assembly = a fast run of ticks with rising pitch; success = a bright bell chord
     (plus a high ping for money in); counters = a tick run; clicks = key + tick; approvals = a click then
     ascending bells per row paid; flows = two glides diverging;
   - hook: pops per chip with rising pitch, slams = kick + thock + bell, implode = reverse swell + whoosh;
   - transitions: a riser into the light, a whoosh on the cut; finale: word slams, a build (claps in 16ths
     rising), a riser into the dive, an impact + a wide chord on the mark, plinks on the recap.
5. **Pan with the picture:** chat on the left pans left, the stage right, flights follow the motion.

## Loudness and QA

- Two-pass `loudnorm` to -16 LUFS / -1.5 dBTP with `LRA=20` and `linear=true` (ffmpeg silently falls back
  to dynamic mode when the target LRA is below the measured one, and the resample step then fails).
- Measure per-second RMS (`bash scripts/qa/loudness.sh`): the intro and every hand-off must not sag below about -25 dB
  unless a silence is intended; fill a sag with a bed pad, a soft pulse or a pickup fill.
- Orchestral recordings instead of synthesis: linear loudnorm cannot reach -16 LUFS without clipping
  tutti peaks; use gain + `alimiter` in two passes.
- Report numbers (integrated LUFS, LRA, peak). Never claim to have listened.

## SFX

- Bundled HyperFrames SFX (pop, whoosh, whoosh-short, whoosh-cinematic, click, click-soft, notification,
  ping, chime, sparkle, impact-bass, riser) placed as `<audio>` elements with `data-start`,
  `data-duration`, `data-volume` 0.1-0.3, only on physical moments: the character pop, the light cut, a
  payment notification, real clicks, the mark impact, the character's final sparkle.
- Keep the licence note (`assets/sfx/CREDITS.md`) in the project.
- Long SFX (a 10 s riser) never; the synth riser is cut to length.
