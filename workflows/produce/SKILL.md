## motion-director.workflow.produce

### Goal

Deliver a finished, verified motion video from a request (a URL, a brand, a product, an agent) by running
the whole chain at the house quality bar.

### Scope

- Applies to: any new HyperFrames video: promos, agent/co-pilot demos, flow showcases, showreels, stings.
- Does not cover: editing existing footage, slide decks, live UI work.

### Triggers

- "Make a video / promo / showreel for <site or product>"
- "Same idea, now for <another brand>", "sell our agent <name>", "show how amazing motion you are"
- Any new video request routed by `/hyperframes` to a custom composition.

### Inputs

- The request, verbatim (it goes into `BRIEF.md`).
- Subject URL(s) and any supplied material (avatar, logo, footage).
- Constraints stated by the user (length, language, aspect, names).
- Defaults when unstated: 1920x1080, 30 fps, the site's language, 35-45 s for promos, 15 s for showreels,
  no narration, `flow: automation`, `storyboard: no` for autonomous runs.

### Invariants

- The hard rules of the entry skill ([../../SKILL.md](../../SKILL.md)).
- Each stage writes its artifact before the next starts; stages communicate only through files.
- The project lives in its own new folder; earlier deliverables are never overwritten.
- The HyperFrames intent layer runs once (it writes `BRIEF.md`); this workflow does not re-ask questions a
  sensible default answers. Ask only when blocked by something the user must decide.

### Procedure

1. **Route and scaffold.** Run `/hyperframes` (intent layer, autonomous when the user is away) and pick
   `general-video` for custom compositions. Scaffold with the pinned CLI:
   `bun x hyperframes@<pin> init <dir> --non-interactive --example=blank --skill=general-video`, then
   `bash <skill>/scripts/project/setup.sh <dir> <pin> <shape>` (scripts, libs, the shape's spine and
   arrangement, devDependencies, `bun install`). Shape: `agent` for an assistant/co-pilot promo (the default,
   also the base for showreels and stings), `stage` for flows, automations and pipelines. Setup never
   overwrites, so pick the shape before the first run.
2. **Research** ([../research/SKILL.md](../research/SKILL.md)). For broad crawls, start a research subagent
   in the background and continue with independent work (scaffold, character, design tokens).
3. **Concept** ([../concept/SKILL.md](../concept/SKILL.md)): pitch round, brief, design, storyboard, spine.
4. **Character** ([../character/SKILL.md](../character/SKILL.md)) when a supplied avatar/mascot exists.
5. **Build** ([../build/SKILL.md](../build/SKILL.md)): compositions on the spine, lint after each file,
   snapshots after the first full pass, fix, repeat.
6. **Score** ([../score/SKILL.md](../score/SKILL.md)): arrangement from the spine, loudness, SFX slots.
7. **Verify** ([../verify/SKILL.md](../verify/SKILL.md)): check to zero, render, MP4 frames, loudness,
   deliverables, report.
8. **Remember:** record new silent failures or preferences where the environment keeps project memory
   (not in this skill, unless they are brand-agnostic craft rules; then update the matching reference).

### Outputs

- `<dir>/out/<name>.mp4`, `<dir>/out/<name>.png`, `<dir>/snapshots/contact-sheet.jpg`
- `<dir>/{BRIEF,DESIGN,STORYBOARD}.md`, `<research>/RESEARCH.md`
- The report (G7 in [../../reference/verification-gates.md](../../reference/verification-gates.md)).

### Review gate

- [ ] Every stage's review gate passed (research, concept, character if any, build, score, verify).
- [ ] `hyperframes check` passed with 0 errors; warnings resolved or justified in the report.
- [ ] The MP4 was inspected by extracted frames (first, last, handoffs, midpoints).
- [ ] Loudness measured and within target.
- [ ] Every on-screen fact traces to `RESEARCH.md`.
- [ ] The report names what was not verified.

### References

- [../../SKILL.md](../../SKILL.md) · [../../reference/quality-bar.md](../../reference/quality-bar.md) ·
  [../../reference/role-contracts.md](../../reference/role-contracts.md) ·
  [../../runbooks/url-to-promo.md](../../runbooks/url-to-promo.md)
