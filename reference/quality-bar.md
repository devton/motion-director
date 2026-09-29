# Quality bar (the default)

What every video made with this skill must be, and what it must never be. Each line is checkable.

## The bar

1. **One concept, stated in one sentence** in `BRIEF.md` (`message:`), and every scene serves it. Five
   concepts were pitched internally and the rejected ones are recorded with a reason.
2. **The product is the protagonist.** The viewer sees real product surfaces (charges, links, schedules,
   dashboards, flows, widgets) being created and changing state, rebuilt as live HTML, not screenshots.
3. **Real copy.** Every product name, label, headline and technical identifier on screen appears verbatim in
   the research, with a URL. Demo data (amounts, people, ids) is plausible, illustrative and consistent
   (totals add up, counters land on the numbers the copy states).
4. **A spine.** All times and shared rects come from one layout lib. Events sit on a 120 BPM grid
   (beat 0.5 s); the score reads the same lib, so every tick, send, check and hit lands on its frame.
5. **Continuity over cuts.** Scenes hand off through objects (a card becomes the next card, an avatar
   flies into its slot, a light opens from behind a character). Hard cuts only on strong beats.
6. **A living frame.** Something always moves: a slow push, a breathing dot, a flickering flame, a counter.
   No held frame longer than ~1.5 s without micro-motion, no blank frames at transitions.
7. **Readable.** Text on screen long enough to read (≥ 0.4 s per short line plus 0.05 s per word),
   contrast ≥ 4.5:1 for body text, no text overlapping text unless it is an intentional stack.
8. **Head-on cards.** UI cards and flow nodes always face the camera; 3D is used for depth (dolly,
   parallax, drops, focus pulls), never to tilt the product.
9. **Sound cut to picture.** A bespoke procedural score in the right register plus sparse physical SFX,
   integrated loudness -16 LUFS ±1, true peak ≤ -1.5 dBTP, no unintended dips below about -25 dB RMS
   in any second.
10. **A designed open and close.** A hook in the first 0.3 s (never a dead first second), and a close that
    lands the official mark untouched, the tagline and a CTA the site itself uses.
11. **Verified.** `hyperframes check` 0 errors and 0 unjustified warnings; snapshot sheets reviewed; the
    rendered MP4 reviewed by extracted frames (first, last, every transition, every scene midpoint);
    a poster and a contact sheet delivered.
12. **Honest report.** What was built, where it lives, the facts it relies on (with sources), what was
    decided autonomously, what could not be verified (e.g. "loudness measured, not listened").

## Anti-patterns (reject on sight)

- A flat `<canvas>` of cards with hard cuts where a 3D stage was expected; far-away "galaxy" wides.
- Tilted or oblique boards; product cards seen from the side.
- Stock looping music, or no sound design at all.
- Invented metrics, invented features, invented UI labels; copying a site mockup that contains
  placeholders; showing an AI tool doing what its vendor says it cannot do.
- Text-only "fake UI" that no real product screen resembles.
- Content parked off-frame that leaks (shadows at frame edges), clipped text that the audit still reads,
  elements popping in with no easing.
- Motion that stops dead mid-shot (every leg of a ride starting and ending at rest), blur over text the
  viewer is supposed to read.
- A final frame that is not the untouched mark / CTA, or a video that ends on a fade to black mid-message.
- Delivering without having looked at the rendered MP4.
