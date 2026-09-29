---
name: motion-director
description: Directs premium HyperFrames motion videos end to end at a repeatable high bar - product promos, agent/co-pilot demos driven by a chat, flow showcases on a head-on 3D stage, showreels, logo stings. Web-only research, one concept, a shared timing/geometry spine, character rigs from supplied avatars, a procedural score cut to picture, and hard verification gates. Use for any request to make, plan or finish a motion video with HyperFrames.
---

# motion-director

The default way to make a motion video here. It turns "make a video about X" into a researched, designed,
scored and verified MP4 whose craft is the same every time: one concept, real product surfaces, motion on a
beat grid, sound cut to picture, zero audit errors.

It sits on top of the HyperFrames skills (`/hyperframes` routing, `/hyperframes-core` contract,
`/hyperframes-animation`, `/hyperframes-cli`, `/media-use`) and never replaces them: it adds the direction,
the house patterns, the scripts and the gates.

## Orchestrator

1. **Classify** the request with [reference/routing-matrix.md](reference/routing-matrix.md):
   a new video, one stage of a video (research, concept, character, build, score, verify), or a fix.
2. **Default route:** a new video always runs `produce` (the full chain). A partial request runs only its
   workflow, reading the artifacts earlier stages left in the project folder.
3. **Load only the selected contract** (`workflows/<cmd>/SKILL.md`) and the references it links.
4. **Close** with the `verify` gate. Nothing is "done" until `verify` passes and the report is written.

## Command routing (router-only)

Invocation: `/motion-director <cmd>`. If subcommands are not parsed, read `<cmd>` from the message.

| cmd | contract | use when |
| --- | --- | --- |
| `produce` | [workflows/produce/SKILL.md](workflows/produce/SKILL.md) | any new video (default) |
| `research` | [workflows/research/SKILL.md](workflows/research/SKILL.md) | facts, copy and brand truth from the web |
| `concept` | [workflows/concept/SKILL.md](workflows/concept/SKILL.md) | brief, design, storyboard, timing spine |
| `character` | [workflows/character/SKILL.md](workflows/character/SKILL.md) | a supplied avatar/mascot must become a rigged vector |
| `build` | [workflows/build/SKILL.md](workflows/build/SKILL.md) | writing or changing compositions |
| `score` | [workflows/score/SKILL.md](workflows/score/SKILL.md) | music and sound marks cut to picture |
| `verify` | [workflows/verify/SKILL.md](workflows/verify/SKILL.md) | gates, render, frames, loudness, report |

No flat alias skills. Manifest: [template.json](template.json).

## Hard rules (every workflow)

- **Content truth.** On-screen facts, product names and copy come only from the subject's public web
  (site, docs, help center, changelog). No invented metrics, no competitor or customer logos, no copy from
  mockups that contain placeholders. Demo data (amounts, names, ids) is illustrative and says so in the brief.
- **Brand truth.** Colours, type and marks come from the subject's own site/brand kit. The official mark is
  shown untouched at rest; motion may reveal it (masks, draws, per-part pops) but never redraws it.
- **Product limits are story constraints.** If the product (or its AI tooling) cannot do something, the video
  does not show it happening unattended; money-out or destructive actions end in a visible human approval.
- **Real people.** A supplied cartoon/illustrated avatar may be vectorized and rigged. A photo of a real
  person is shown only as a static crop; it is never altered, lip-synced or given invented features.
- **Determinism.** One paused, seek-safe timeline per composition; no `Math.random`, `Date`, network or
  wall-clock anything at render time. Per-frame drivers are pure functions of time.
- **One spine.** All timing and shared geometry live in one layout lib read by every composition and by
  the score script ([reference/timing-architecture.md](reference/timing-architecture.md)).
- **Cards face the camera.** UI cards and flow nodes are always head-on; depth comes from dolly, parallax,
  focus pulls and props, never from tilting the board ([reference/stage-3d.md](reference/stage-3d.md)).
- **Tooling.** `bun`/`bun x` only (never `npx`/`npm`), a pinned HyperFrames CLI version per project, a local
  ffmpeg from devDependencies ([scripts/project/](scripts/project/)). Scratch files go to the job's tmp dir.
- **Verification is the definition of done.** `hyperframes check` with 0 errors (warnings resolved or
  justified), snapshot sheets inspected, the rendered MP4 inspected by extracted frames, loudness measured
  ([reference/verification-gates.md](reference/verification-gates.md)).
- **Language.** Skill documents, code and comments in English; on-screen copy in the subject's own language.
- **HTML manuals** only when explicitly requested.
- **Brand-agnostic skill.** This skill and its scripts never name a real brand or past project; project
  facts live in the project folder (`RESEARCH.md`, `BRIEF.md`, `DESIGN.md`).

## References (progressive disclosure)

- [reference/routing-matrix.md](reference/routing-matrix.md): intents -> commands
- [reference/role-contracts.md](reference/role-contracts.md): roles, artifacts, handoffs
- [reference/quality-bar.md](reference/quality-bar.md): the default standard and its anti-patterns
- [reference/research-protocol.md](reference/research-protocol.md): web-only research, verbatim copy, flags
- [reference/concept-patterns.md](reference/concept-patterns.md): story shapes, hooks, transitions, finales
- [reference/timing-architecture.md](reference/timing-architecture.md): the layout spine, beat grid, handoffs
- [reference/motion-vocabulary.md](reference/motion-vocabulary.md): the moves, with durations and eases
- [reference/stage-3d.md](reference/stage-3d.md): head-on 3D stage, camera, rides, drops, rings
- [reference/chat-driven-demo.md](reference/chat-driven-demo.md): pinned chat that drives product surfaces
- [reference/character-rig.md](reference/character-rig.md): avatar vectorization, validation, rigs
- [reference/audio-scoring.md](reference/audio-scoring.md): procedural score, marks, SFX, loudness
- [reference/hyperframes-gotchas.md](reference/hyperframes-gotchas.md): silent failures and their fixes
- [reference/verification-gates.md](reference/verification-gates.md): gates, render checks, report
- Runbooks: [runbooks/agent-role-system.md](runbooks/agent-role-system.md),
  [runbooks/url-to-promo.md](runbooks/url-to-promo.md)
- Scripts: [scripts/](scripts/) · Templates: [templates/](templates/) (agent shape:
  [templates/index.example.html](templates/index.example.html); stage shape:
  [templates/index.stage.example.html](templates/index.stage.example.html))
