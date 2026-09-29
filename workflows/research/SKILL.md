## motion-director.workflow.research

### Goal

Produce `RESEARCH.md`: the verbatim copy, product facts, limits, UI labels and brand truth the video is
allowed to use, each with its public source.

### Scope

- Applies to: any subject with a public web presence (site, docs, help center, changelog, repos).
- Does not cover: private data, the user's own codebase (only glanced at when the user allows it, for
  look and feel, never as a source of claims), social media gossip.

### Triggers

- The `produce` chain, step 2.
- "Research first", "use only what is on the web", "what can the product actually do".

### Inputs

- Subject URL(s); the names the video will use (product, agent, features).
- The pinned CLI version (for `capture`).
- A research folder next to the project (`<research>/`).

### Invariants

- Public web only; quotes are verbatim and carry their URL.
- Raw copies of quoted pages are saved; quotes are checked against them by script.
- A claim that is not in the research does not reach the screen.
- Flags (name collisions, recent launches, product limits, placeholders, locale) are raised, not resolved
  silently.

### Procedure

1. **Capture the site:** `bun x hyperframes@<pin> capture <url> -o <research>/capture` (run from the
   research folder, not from another project, or the capture lands inside that project). Read the contact
   sheets, `extracted/visible-text.txt`, `tokens.json`, `design-styles.json`, asset descriptions.
2. **Docs:** fetch `llms.txt`/`llms-full.txt` if present; else crawl the docs to text with an index.
3. **Targets** (delegate to a subagent for breadth, with the output path and a 400-word summary back):
   feature pages, API resources and event names, SDKs, shareable URL formats, dashboard labels, the
   subject's AI/agent offering and its stated limits, pricing and company facts, locales.
4. **Write `RESEARCH.md`** with the sections of [../../reference/research-protocol.md](../../reference/research-protocol.md).
5. **Brand kit:** list colours (hex), fonts (files, weights, licence), marks (which variant on which
   background), illustrations and hero treatment, with file paths in the capture.
6. **Flags:** write them at the top of `RESEARCH.md` and repeat them in the final report.

### Outputs

- `<research>/RESEARCH.md`, `<research>/capture/`, `<research>/web/` (raw pages), optional `docs/` text.

### Review gate

- [ ] Positioning, features, technical truth, UI labels, brand, limits, numbers, flags, sources present.
- [ ] Every string planned for the screen is quoted verbatim with a URL.
- [ ] Product limits relevant to the story are explicit (and mapped to on-screen approvals if needed).
- [ ] No private or third-party material (employee photos, customer logos) collected for use.

### References

- [../../reference/research-protocol.md](../../reference/research-protocol.md) · [../../SKILL.md](../../SKILL.md)
