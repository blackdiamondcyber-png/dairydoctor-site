# HANDOFF — dairydoctor-site

**Updated 2026-09-22.** Read this first; the 2026-08-10 engagement record is in
`SESSION-HANDOFF-2026-08-10-full-engagement.md` and is still accurate for history.

## State right now

- Repo is **public again with Pages enabled** from `master` root (done 22 Sep via
  `gh`). It had gone private a second time after 18 Sep, Pages off; cause unknown,
  Erik is reading his account security log (`action:repo.access`). Preview:
  https://blackdiamondcyber-png.github.io/dairydoctor-site/
- `dairydoctor.com` still serves the 2006 site from the old host over http. The public
  site was never on Pages. **No DNS change until Glenn says so.**
- 22 Sep: **Tier 1 repositioning built** (no new URLs, no price touched). Analysis and
  plan: https://claude.ai/artifact/G6XM3qpezmjT1KbrxU6QRb

## What changed 22 Sep (Tier 1)

- `index.html`: eyebrow says place not year; shorter lede; stat card = Over 99% /
  Read by the DVM / Four species; trust strip = BioPRYN affiliate / Disease monitoring /
  1999 ("48 states" lives on About only); service cards rewritten (consulting CTA ->
  `aboutus.html#consulting`, BVD -> `bvdtest.html#program`); **new "Who we work with"**
  band, six `.card`s in `.cards-6`; step 4 reads as the weekly rhythm; about teaser and
  tagline no longer repeat 1999.
- `pregtest.html`: new `#heifers`, `#goats` (goat figure moved here), `#bison` (bison
  figure moved here), `#large-herds`, `#results` (pregnant / open / recheck).
- `bvdtest.html`: `#program`, five numbered steps + "Ask for a herd plan" button.
- `aboutus.html`: `#consulting`, service names taken from the 2006 site's own list.
- `contact.html`: "What do you need?" checkbox fieldset (`need_*` fields; FormSubmit's
  table template prints them).
- `shipping_test.html`: BVD samples ship cold / 48-hour rule; `#supplies` list, no prices.
- `faq.html`: goats and sheep, heifers at a grower, what "recheck" means.
- Nav on all 10 pages: Testing menu gains **Goats & Sheep** -> `pregtest.html#goats`.
- `css/style.css`: `.stat-num-text`, `.cards-6`, `.form-choices` / `.choice`.
- Verified 22 Sep in the Browser pane: 0px horizontal overflow on all 10 pages at
  375px, every new anchor resolves, 0 broken internal links, tags balanced, 0 em-dashes.

## The brief (Glenn, 15 Aug, via Erik 5 Sep: "take it or leave it")

1. Off the price fixation. He sells trust, performance, experience, honesty.
2. He is not competing nationally. Never benchmark him against a national scrape.
3. He is a **veterinary consultant** (Erik). Imagery and copy show the vet, not a lab.
4. **"Don't be moving anything"**: no DNS cutover, no domain move, until he says so.
5. He rejects AI-generated business strategy. Anything he sees must read as Erik's
   own work: no AI tells, no unrequested market analysis. Design and mechanics only.

Facts he corrected that invalidate earlier analysis: BioTracking directory prices
are >10 years stale for most labs (never benchmark on them); same-day results have
no economic value in cattle resynch (never frame turnaround as an axis); Waupun's
$2.75/same-day is not a real threat; BVD price comparisons need matching platform.

## Still open

- Glenn, by phone (Erik's words): Q1 which inbox (form + `_next` stay pending);
  Q2 results format, spreadsheet by cow ID (then add a line to `#large-herds` and an
  FAQ); Q3 Johnes / Leukosis / Mycoplasma in-house or sent out, and price (then a
  section or leave as a mention); Q4 what consulting is and how it is paid (then the
  "how it starts" lines on About); Q5 goat volume (gates Tier 2).
- Tier 2 (`goats.html`, `consulting.html`) only with Erik's explicit OK; adds URLs.
- Why the repo keeps flipping private.
- Licensing: two photos are CC BY-SA 4.0. Attribution lives in `IMAGE-CREDITS.md`
  and a footer credit on every page. Keep both if images change.

## Gotchas

- Playwright MCP can be locked by another process; Brave headless captures are
  reliable at desktop widths but lay out wide at phone widths (clipped-right
  artifact). Measure mobile with Browser-pane JS or same-origin iframes.
- `sharp-cli -o dir/` overwrites originals in place. Use PIL with explicit names.
- Local preview: launch config `dairydoctor` in `~/.claude/launch.json`, port 8123.
- `.hero .hl` needs `box-decoration-break: clone`; `.nav-row` must never be an
  overflow-x scroller; nav sizing tiers at <=430 and 431-699px.
- Edit pages with a Python script run from Bash (assert exact matches). The Prettier
  PostToolUse hook reformats any `.html` the Write/Edit tools touch and bloats the diff.
- Playwright MCP is often locked by another session. The Browser pane works: batch
  navigate + screenshot, and audit every page at once with same-origin iframes at 375px.
- `html { scroll-behavior: smooth }` defeats scripted scrolling before a screenshot;
  set `documentElement.style.scrollBehavior='auto'` first.
