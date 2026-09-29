# Routing matrix

One request routes to one command. A new video always starts at `produce`; the other commands are its
stages, runnable alone when a project folder already holds the earlier artifacts.

| Intent (examples) | Command | Slash form | Reads | Writes |
| --- | --- | --- | --- | --- |
| "Make a promo / launch video / showreel for <site>", "a video selling <agent>", "same idea, now for <brand>" | `produce` | `/motion-director produce` | the request | everything below, then the report |
| "Research <site> first", "what can the product really do", "collect the copy" | `research` | `/motion-director research` | URLs | `RESEARCH.md`, raw page copies, capture |
| "Pitch me concepts", "write the brief/storyboard", "re-time it" | `concept` | `/motion-director concept` | `RESEARCH.md` | `BRIEF.md`, `DESIGN.md`, `STORYBOARD.md`, `assets/lib/layout.js` |
| "Use this avatar / mascot as the agent", "make the character blink/think" | `character` | `/motion-director character` | the supplied image | `assets/lib/<character>.js`, validation numbers |
| "Build the scenes", "add a scene", "fix the handoff at 5 s" | `build` | `/motion-director build` | spine + design | `compositions/*.html`, `index.html` |
| "Add music", "the sound is too quiet there", "cut the music to the picture" | `score` | `/motion-director score` | spine | `scripts/synth-score.mjs`, `assets/audio/score.wav`, SFX slots |
| "Check it", "render it", "is it ready?" | `verify` | `/motion-director verify` | the project | check logs, sheets, MP4, poster, report |

## Tie-breakers

- A request that names a style reference ("like the last one", "same shape") is still `produce`: the
  reference changes the concept inputs, not the route.
- The story shape picks the starting kit, not the route: an assistant/agent/co-pilot promo starts from the
  `agent` shape (chat + surfaces), flows, automations and pipelines from the `stage` shape (the head-on 3D
  stage); showreels and stings start from `agent` and replace the spine. Pass it to `setup.sh` before the
  first run ([concept-patterns.md](concept-patterns.md)).
- A bug in motion or layout is `build`, then `verify`. A bug in sound is `score`, then `verify`.
- A request for a static title card or a sub-10 s motion unit still uses this skill's gates, but its
  concept is one scene; `produce` keeps the chain, shortening each stage.
- Anything that is not HyperFrames (a slide deck, a live UI, a screen recording) is out of scope.
