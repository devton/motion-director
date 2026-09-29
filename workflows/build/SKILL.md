## motion-director.workflow.build

### Goal

Write the compositions on the spine so the film plays the storyboard exactly, hands off pixel-perfectly and
lints clean.

### Scope

- Applies to: `index.html`, `compositions/*.html`, shared UI libs; new scenes, fixes, re-timings.
- Does not cover: research, concept changes (go back to `concept`), audio (`score`).

### Triggers

- The `produce` chain, step 5; "build the scenes", "fix the transition at N s", "add a surface".

### Inputs

- `STORYBOARD.md`, `DESIGN.md`, `assets/lib/layout.js`, the character module, brand assets.
- Templates: [../../templates/](../../templates/) (libs, chat, 3D stage, title).

### Invariants

- Read `/hyperframes-core` before writing composition HTML; cite blueprint/rule ids from
  `/hyperframes-animation` for each scene.
- One paused timeline per composition registered on `window.__timelines[id]`; baselines in build-time
  `gsap.set`; every delayed `fromTo` has `immediateRender: false`; the timeline extends to its slot.
- Per-frame drivers go through one timeline-level dispatcher (`hwOnUpdate`) and are pure functions of
  `tl.time()`; style writes go through a cache.
- No hard-coded times or shared rects: everything from the spine (`const at = (r) => r - T0`).
- Cards head-on; visibility via `autoAlpha`/`""`, never `"visible"`; intentional stacks marked for the audit.
- Every gotcha in [../../reference/hyperframes-gotchas.md](../../reference/hyperframes-gotchas.md) applies.

### Procedure

1. **Libs:** `templates/lib/{hw,ui,camera,board}.js` are in `assets/lib/` (setup); brand data libs (official mark
   paths, a scannable code matrix if the product uses one) as plain data files.
2. **Backdrop** (`bg.html`): the subject's hero world (image or gradient + light), the second world (e.g. a
   light workspace) revealed by an iris centred on the character; the reverse for the close; a slow drift.
3. **Hook** (`hook.html`): chips and slams per [../../reference/concept-patterns.md](../../reference/concept-patterns.md);
   the character's pop, hello bubble (authored at 1x, posed at 2x), the flight to its landing rect. A film
   without a character opens on kinetic slam lines that dive into the next world
   ([../../templates/compositions/title.html](../../templates/compositions/title.html)).
4. **Main surface:** either the chat ([../../templates/compositions/chat.html](../../templates/compositions/chat.html))
   or the 3D stage ([../../templates/compositions/stage-3d.html](../../templates/compositions/stage-3d.html),
   the world, with its screen overlays in
   [../../templates/compositions/stage-hud.html](../../templates/compositions/stage-hud.html) on the same
   window), parameterized from the spine.
5. **Per-ask surfaces** (one composition per surface, windows overlapping by 0.25-0.4 s): real product objects
   with the product's labels; card-deck handoffs; state changes; counters; event names in mono.
6. **Tracker / HUD:** feature chips that check off; the running counter strip; chapter cards when used.
7. **Finale** (`finale.html`): headline, dive or tunnel, mark draw/reveal to the untouched mark, the
   character's line, the CTA, the recap; a slow push to the last frame.
8. **After each file:** `bash scripts/hf.sh lint`. **After the first full pass:** snapshots at the storyboard
   times and both sides of every handoff; fix; repeat until the sheets pass G2.

### Outputs

- `index.html`, `compositions/*.html`, `assets/lib/*.js`, updated `STORYBOARD.md` statuses.

### Review gate

- [ ] Lint 0 errors.
- [ ] Snapshot sheets pass G2 of [../../reference/verification-gates.md](../../reference/verification-gates.md)
      (no blank frames, no stray elements, no clipped or overlapping text, overlays in place).
- [ ] Each handoff verified one frame before and after (identical rects).
- [ ] No time or shared rect defined outside the spine.

### References

- [../../reference/motion-vocabulary.md](../../reference/motion-vocabulary.md) ·
  [../../reference/chat-driven-demo.md](../../reference/chat-driven-demo.md) ·
  [../../reference/stage-3d.md](../../reference/stage-3d.md) ·
  [../../reference/hyperframes-gotchas.md](../../reference/hyperframes-gotchas.md)
