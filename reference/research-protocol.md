# Research protocol (web only)

The video may only claim what the subject publicly says. Research is therefore the first artifact of every
run, and it is written so a builder can copy strings from it without re-opening a browser.

## Sources, in order

1. **The site capture.** `bun x hyperframes@<pin> capture <url> -o <research>/capture` gives screenshots,
   `extracted/visible-text.txt` (text in DOM order), design tokens, computed styles, downloaded assets and
   SVGs. Read the contact sheets first; they show the whole page at a glance.
2. **The docs.** Look for `llms.txt` / `llms-full.txt` on the docs host before crawling; they are the
   fastest verbatim source. Otherwise crawl the docs to text (one `.md` per page plus an index).
3. **Help center, changelog, pricing, app-store listings.** Changelogs date features and often carry the
   most recent product language. Help centers carry real dashboard labels (menu names, button labels).
4. **Public repos and packages** (SDK names, CLIs, example payloads, event names).
5. **Search** for the product's AI/agent offering specifically (MCP servers, assistants, prompt libraries,
   llms.txt). Report exactly what exists, with dates, and what does not.

For broad crawls, delegate to a research subagent with a self-contained brief (targets, verbatim rule, the
output file path, a 400-word summary back). Do not duplicate its crawl while it runs.

## What to record (`RESEARCH.md`)

- **Positioning, verbatim:** H1, subheads, taglines, section titles, CTA labels, stat lines, with URLs.
- **Features, verbatim:** each product page's headline and 1-3 lines; the exact product names.
- **Technical truth:** API resources and endpoints, event/webhook names, example payload fields, SDK/package
  names, sandbox/production hosts, URL formats of shareable objects (payment links, invites).
- **UI labels:** menu items, tab names, button labels, status names as the product shows them.
- **Brand:** colours (hex), fonts (families and weights), marks (official SVG/PNG, which variant on which
  background), illustration language, the hero treatment.
- **Limits and policies:** what the product or its AI tooling explicitly cannot do, approval requirements,
  compliance lines. These become story constraints.
- **Numbers:** only the ones the site states, each with its page; if two pages disagree, pick one and cite it.
- **Raw copies:** save every quoted page under `<research>/web/` and check quotes against them by script.

## Flags to raise before the concept

- **Name collisions:** an agent/character name that matches a real person at the company, a trademark, or
  an existing product. Record it; the user decides.
- **Timing collisions:** the subject launched something related days ago (a video on the same theme will
  sit next to it). Record the date and the official line.
- **Placeholders:** site mockups with literal placeholders ("$ [X]", "[Approver 1]") must not be copied.
- **Locale:** the site's default language decides the on-screen language unless the user says otherwise.
- **Out-of-scope data:** photos of real employees, customer logos, testimonials: never reused.

## Output checklist

- [ ] `RESEARCH.md` with sections: positioning, features, technical truth, UI labels, brand, limits,
      numbers, flags, sources.
- [ ] Every string intended for the screen is in the file verbatim with its URL.
- [ ] Brand tokens ready for `DESIGN.md` (hex, fonts, marks with file paths).
- [ ] Assets copied into the project only from the capture or official brand kits.
