# motion-director

A skill that directs HyperFrames motion videos end to end: research, concept, design, build, sound and
verification. Every video ships at the same bar: one clear idea, real product screens, motion on a beat
grid, a score cut to the picture, and zero audit errors.

The skill is brand-agnostic. Everything about a subject (its copy, colours, logo, facts) lives in the
project folder, never in the skill.

## What it makes

| Format | Typical length | What it looks like |
| --- | --- | --- |
| Showreel | 15 s | One object travels through six scenes (kinetic type, a 3D object, a product screen, a data moment, a generative pattern, the logo), handed off from scene to scene, in one style: engineered precision, paper collage, dark neon line or text-only terminal. |
| Recap / summary | 20-45 s | The highlights of a period or of a product (launches, releases, numbers you can source), each as a real screen or a figure that counts up, closing on the logo. |
| Short spot | 10-15 s | A teaser, social ad or bumper: a hook in the first second, one idea, the call to action. |
| Logo sting / title card | up to 10 s | A hook in 0.3 s, one transformation, the untouched logo by 70 % of the duration, then a hold. |
| Launch / product promo | 30-45 s | The product's real screens animated around one message, built from the site's own copy and colours. |
| Flow showcase | 20-60 s | Steps, pipelines or automations built card by card on a head-on 3D board, then run with values riding the wires. |

Unless you say otherwise: 1920x1080, 30 fps, the subject's language, 35-45 s for promos, 15 s for
showreels, no narration.

## Install

```bash
npx skills add devton/motion-director       # this project
npx skills add devton/motion-director -g    # every project (user-level)
```

Requirements:

- [bun](https://bun.sh) (the skill's scripts never use npm or npx).
- The HyperFrames skills (the `/hyperframes` router and its domain skills) in the same environment: this
  skill builds on them.
- Nothing else global: each project pins its own HyperFrames CLI version and gets ffmpeg and ffprobe as
  dev dependencies.

Or, from a local copy, link the folder into a skills directory. Either way, start a new session so the
skill loads:

```bash
ln -s ~/Work/motion-director ~/.claude/skills/motion-director   # available in every project
ln -s ~/Work/motion-director .claude/skills/motion-director      # or in one repository only
```

## Quick start

```text
/motion-director produce
A 15-second showreel for https://example.com, engineered-precision style, 16:9.
```

That one request runs the whole chain:

1. **research**: reads the public site, docs and changelog; keeps the real copy, colours and logo.
2. **concept**: pitches five ideas, picks one, writes the brief, the design, the storyboard and the timing.
3. **character**: only when you supply a mascot or an illustration to animate.
4. **build**: writes the scenes, lints every file, reviews snapshot sheets and fixes what they show.
5. **score**: synthesizes a score cut to the picture, normalized to -16 LUFS.
6. **verify**: runs `hyperframes check` to zero errors, renders, inspects the MP4 frame by frame,
   measures the loudness and writes the report.

What you get:

- `out/<name>.mp4`, ready to share, and `out/<name>.png`, the poster.
- `snapshots/contact-sheet.jpg`, a grid of frames taken from the final MP4.
- `BRIEF.md`, `DESIGN.md`, `STORYBOARD.md` and `RESEARCH.md`.
- A short report: what was made, the story in a few beats, every fact with its source, the decisions
  taken, what was and was not verified, and how to re-render.

Say where the project should live ("put it in videos/launch-teaser"); otherwise it gets a new folder of
its own. Earlier videos are never overwritten.

## Commands

Type `/motion-director <command>` followed by your request.

| Command | Use it to | Example |
| --- | --- | --- |
| `produce` | make a new video (the default) | `/motion-director produce` + your request |
| `research` | collect facts, copy and brand assets from the web | `/motion-director research https://example.com` |
| `concept` | pitch ideas, write the brief and storyboard, re-time | `/motion-director concept` pitch five ideas for a 15 s teaser |
| `character` | turn a supplied mascot or illustration into an animatable vector | `/motion-director character` use mascot.png as the host |
| `build` | write or change scenes | `/motion-director build` the cut at 5 s feels abrupt |
| `score` | music and sound marks cut to the picture | `/motion-director score` the intro is too quiet |
| `verify` | check, render, inspect and report | `/motion-director verify` |

Each stage reads what the earlier ones left in the project folder, so any of them can run alone on an
existing project.

## Writing a good request

The more of these you give, the fewer guesses it makes:

- **Subject:** a URL is best (the copy, colours and logo come from the page), or a name plus the pages to
  trust.
- **The one message:** what should someone remember after watching?
- **Format and length:** "15 s showreel", "30 s recap", "6 s logo sting".
- **Aspect and destination:** 16:9 for a site or a talk (the default, and what the templates are built
  for); 9:16 for stories and reels and 1:1 for feeds are laid out per project.
- **Language** of the on-screen copy (default: the site's).
- **Style:** bright and friendly, calm and engineered, hand-made collage, dark neon, terminal.
- **Must-haves:** the features, numbers, tagline or call to action that have to appear.
- **Must-nots:** claims, features or screens to leave out.
- **Your assets:** the logo (SVG is best), screenshots, a mascot illustration, fonts.
- **Numbers:** paste them or point to where they are public (a changelog, a blog post); none are invented.
- **Sound:** a mood, or "no music"; narration only if you ask for it.
- **Review points:** "show me the concepts first" or "storyboard first" to approve before the build;
  otherwise it runs straight through to the finished video.

Prompts can be written in any language; the video's copy follows the language you ask for.

## Example prompts

### Showreels (15 s)

```text
/motion-director produce
A 15-second showreel for https://example.com. One object travels through six scenes: kinetic type,
a 3D object, a product screen, a data moment, a generative pattern and the logo, each handed off to
the next. Engineered-precision style: grid, snaps, real functional objects. Bright, confident score. 16:9.
```

```text
/motion-director produce
A paper-collage showreel, 15 s, for our studio site https://example.com: stickers, stamps and tape,
hand-drawn lines that boil at 12 fps, a fold into an envelope that opens on the logo. Warm, playful music.
```

```text
/motion-director produce
A dark neon showreel, 15 s: one continuous line of light runs through every scene and finally draws
our logo. Minimal copy, deep bass, 16:9.
```

```text
/motion-director produce
A text-only showreel, 15 s: everything rendered in characters. A terminal HUD, a request from our public
API docs streaming in, an ASCII render of the product, the logo as a character mosaic.
```

### Recaps and summaries

```text
/motion-director produce
A 30-second year-in-review for https://example.com: the four biggest launches of the year from our
changelog, each shown on its real screen, and the numbers from https://example.com/blog/year-in-review
counting up. Close on "See you next year" and the logo.
```

```text
/motion-director produce
A monthly release recap, 20 s, vertical 9:16: the five features we shipped this month
(https://example.com/changelog), one beat each, a checklist that ticks off as they appear,
and the call to action "Update now".
```

```text
/motion-director produce
Summarize what our product does in 20 seconds for the homepage hero: the problem in one line, three
features as real screens, then the logo and the site's own "Start free" button. No voice-over.
```

```text
/motion-director produce
A 45-second getting-started summary of our docs (https://example.com/docs): the three setup steps, each
on its real screen with a step number in the corner, ending on the first successful result.
```

### 15-second spots

```text
/motion-director produce
A 15 s teaser for our launch on <date>: three short slam lines with our tagline, one hero shot of the
new screen, the date and the logo. Only claims that are on the landing page.
```

```text
/motion-director produce
A 15-second vertical ad (9:16) for https://example.com: a hook in the first second, one feature shown
for real, and the call to action from the site's main button.
```

```text
/motion-director produce
A 10-second bumper to open our conference talk: the talk title, the event name and our logo.
Calm, no big hits.
```

### Logo stings and title cards

```text
/motion-director produce
A 6-second logo sting from logo.svg (attached): a hook in the first 0.3 s, one transformation, the
untouched logo on screen by second 4, then hold.
```

```text
/motion-director produce
A 5-second title card for our video series "<name>" in our brand colours: the logo drawn along its
centre line, then the series name slamming in word by word.
```

### Launch and flow videos

```text
/motion-director produce
A 40-second launch video for https://example.com. Research the site and pitch me five concepts first;
build the one I pick.
```

```text
/motion-director produce
A 30-second video of our workflow builder: placeholder cards appear, then the real cards drop in on the
beat (a trigger, two steps, a split), the flow runs with the amounts riding the wires, and three flows
end up running side by side. Cards always face the camera.
```

```text
/motion-director produce
Same format as the last video, now for https://another.example.com.
```

### Fixes and follow-ups

```text
/motion-director build    the transition at 12 s is abrupt; let the next screen grow out of the previous card
/motion-director build    the logo arrives too late; land it by 70 % of the video
/motion-director concept  re-time it to 20 s and keep the same scenes
/motion-director concept  switch the on-screen copy to Spanish
/motion-director score    the intro is too quiet, and the music should hit on the logo
/motion-director verify   render the final version and give me the report
```

## What "done" means

- `hyperframes check` passes with 0 errors; any remaining warning is justified in the report.
- Snapshot sheets reviewed at every scene and on both sides of every transition.
- The rendered MP4 inspected by extracted frames (first, last, transitions, midpoints).
- Loudness at -16 LUFS ±1, peak under -1 dBFS.
- Every on-screen fact traced to a public source or to material you supplied.

Details: [reference/quality-bar.md](reference/quality-bar.md) and
[reference/verification-gates.md](reference/verification-gates.md).

## Ground rules

- **Real content only.** Names, copy and numbers come from the subject's public pages or from you; no
  invented metrics, no competitor logos. Demo values (amounts, names) are marked as illustrative.
- **The logo stays the logo.** Motion may reveal it (masks, draws, part by part), but the official mark
  is shown untouched at rest.
- **Honest product.** The video never shows the product doing something it cannot do.
- **Real people.** A mascot or an illustration can be vectorized and animated; a photo of a real person
  is only ever a static crop.
- **Screens face the camera.** Depth comes from camera moves, parallax and focus, never from tilting UI.
- **Deterministic.** No randomness or clock at render time: a project renders the same way every time.

## Working by hand

Every project gets these scripts in its `package.json`:

```bash
bun run dev      # preview in HyperFrames Studio
bun run check    # lint, runtime, layout, motion and contrast checks
bun run score    # rebuild the score and normalize it to -16 LUFS
bun run render   # render and write out/<name>.mp4
```

And these helpers:

```bash
bash scripts/qa/check-summary.sh                                   # only the findings of the check
bash scripts/qa/contact-sheet.sh out/<name>.mp4 sheet.jpg 4 0.5 3 6 9 12 14.5   # frames at those seconds
bash scripts/qa/loudness.sh out/<name>.mp4                         # LUFS, peak, RMS per second
```

To start a project without the full chain:

```bash
bun x hyperframes@0.8.85 init my-video --non-interactive --example=blank --skill=general-video
bash ~/Work/motion-director/scripts/project/setup.sh my-video 0.8.85         # default kit
bash ~/Work/motion-director/scripts/project/setup.sh my-video 0.8.85 stage   # 3D flow-board kit
```

Then start from the matching index in [templates/](templates/) and its scenes in
`templates/compositions/`. The setup script only adds files; it never overwrites what a project has.

## Inside the folder

```text
SKILL.md              entry point: orchestrator, command routing, hard rules
template.json         command manifest
workflows/<command>/  one contract per command (goal, inputs, procedure, review gate)
reference/            the craft: quality bar, story shapes, timing, motion, 3D stage, sound, gotchas, gates
runbooks/             end-to-end playbooks
scripts/project/      project setup, pinned CLI wrapper, render, score build
scripts/qa/           check summary, contact sheets, loudness
scripts/score/        procedural score engine and arrangement templates
scripts/vectorize/    turn a supplied illustration into a clean, animatable vector
templates/            starting scenes, shared libraries and index files
```

Start with [SKILL.md](SKILL.md) to see how a request is routed, and
[reference/concept-patterns.md](reference/concept-patterns.md) for the story shapes, hooks, transitions
and finales.
