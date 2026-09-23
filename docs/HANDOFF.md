# HANDOFF - dairydoctor-site

**Updated 2026-09-23.** Read this first; the 2026-08-10 engagement record is in
`SESSION-HANDOFF-2026-08-10-full-engagement.md` and is still accurate for history.

## State right now

- Repo is **public with Pages enabled** from `master` root. It had gone private twice
  (cause unknown; Erik is reading his account security log, `action:repo.access`).
  Preview: https://blackdiamondcyber-png.github.io/dairydoctor-site/
- `dairydoctor.com` still serves the 2006 site from the old host over http. The public
  site was never on Pages. **No DNS change until Glenn says so.**
- Builds on `master`, newest last:
  1. `0a7e92a` Tier 1 repositioning (22 Sep; no new URLs, no price touched).
  2. `a77348d` + `501a8e0` ten interactive tools + twelve Commons/USDA photographs.
  3. `0725856` + `7d0b072` **first ten-critic pass** (22 Sep): 149 findings, ~120 applied.
  4. `23a04b8` **second ten-critic pass** (23 Sep, this handoff): the same ten personas
     re-read the revised site; this time every fix was verified by computed style
     and behaviour in the browser, not by markup. Details below.
- Live Lighthouse (mobile) after round two: perf/a11y/BP/SEO: index 100/100/100/100 - pregtest 100/100/100/100 - bvdtest 100/100/100/100 - tailbleeding 100/100/100/100 - shipping_test 100/100/100/100 - faq 100/100/100/100 - aboutus 100/100/100/100 - contact 100/100/100/100 - credits 100/100/100/100 (run 23 Sep against 23a04b8)
- Reports for Erik: repositioning https://claude.ai/artifact/G6XM3qpezmjT1KbrxU6QRb ;
  field comparison + measured scores + both critic rounds
  https://claude.ai/artifact/JfS9VoM1dW8XqFcn9pEaSX ; round-two UX audit
  https://claude.ai/artifact/6sr3EeBCJ1DPXWNR5WQ8SU

## What round two changed (commit 23a04b8)

- **First-pass claims that were false, now fixed.** `.jump-row a` used `var(--line)`,
  a token that never existed (no border); the 44px pill/badge height was in the 22 Sep
  handoff but never in the CSS; `#tail-steps` was `display:grid`, which beats the
  `hidden` attribute, so "Show all steps" never hid anything. Now: `--line-strong`
  token, `[hidden] { display: none !important }`, the static list starts `hidden`
  with a `<noscript>` restore, `.stepper.is-list` hides the one-step view.
- **Tools.** Records checklist (About) labels leftovers "Still to gather"; both print
  buttons print only the named block (`printFocus()` in tools.js: `body.print-focus`
  + `.print-target`, CSS uses `:has()`, older browsers print the full page as before);
  ship-by planner no longer flags Sunday arrivals; FAQ "Expand all" scopes to the
  filtered items; empty state is `role=status` and re-inserted so it announces.
- **Phone header.** 218px tall at 375 wide (call button wrapped under the brand).
  Under 480px the call button is a 44px round icon (number kept in an sr-only span),
  the legal name is 0.72rem; under 720px `.scrolled` folds the legal name away.
  Measured: 149px at rest, 117px scrolled, 135px on desktop (unchanged).
- **Sharing / search.** Per-page `og:image` (band images with true dimensions);
  `credits.html` generated from `IMAGE-CREDITS.md` (footer links there, not to the
  raw `.md`); homepage card `sizes` matches the 333px slot; `header-mark-140.png`
  1x + `header-mark.png` 2x; `cow_ears_flick.gif` deleted (unreferenced); dead CSS
  rulesets removed; goats/bison figures capped at their 900px source width;
  llms.txt names fixed (x2), volume-discount and 48-hour lines removed.
- **Copy.** FAQ loses "roughly 48 hours"; phone label loses its asterisk (never
  `required`); privacy note says what FormSubmit does; contact's #new-client section
  now mentions the discount every badge promises and the bottom note links back to the
  form; About h2 "More than 20 years with BioPRYN" (Glenn's own paragraph); BVD and
  FAQ get jump rows (pregtest's trimmed 9 -> 6); duplicate CTAs cut (BVD second "Ask
  for a herd plan", home hero badge moved to the closing block); shipping step 5
  absorbs the cold-chain info block; stepper "Next step" is the one filled button and
  the hint sits under the buttons.

## Deliberately NOT changed (Glenn's rules or his own words)

- No price moved anywhere; no price put above the fold or on the home cards.
- Glenn's own claims stay: "first BioPRYN affiliate east of the Rockies", 70% subclinical,
  $35/cow study, Express FP10, Estroplan/Gonabreed, 3 to 6 inches, "15 years" + 1999,
  "Dr. Pearson is only a phone call away".
- No response-time window invented; no geo coordinates or sameAs guessed in JSON-LD;
  `VeterinaryCare` type kept; About title stays "About Dr. Glenn Pearson, DVM".
- Turnaround is never framed as a race (Wednesday in, Thursday out, on purpose).

## For Glenn (Erik asks by phone)

1. Which inbox: the form posts to `info@dairydoctor.com` via FormSubmit; has the
   one-time activation email been clicked? (Nothing arrives until it is.)
2. **The PDF forms print `dairydoctor@reagan.com`** as the lab email (both pregnancy
   forms); the BVD form has no email at all. Reissue or confirm that mailbox is read.
3. Needle gauge and length he recommends for tail bleeding (page states none).
4. Results format (spreadsheet by cow ID?) for the large-herd section and FAQ.
5. Johnes / Leukosis / Mycoplasma: in-house or sent out, and pricing.
6. What consulting is and how it is paid; goat volume (gates Tier 2 pages).

## Gotchas

- Edit pages with a Python script run from Bash (assert exact matches, idempotent
  helpers). The Prettier PostToolUse hook reformats any `.html`/`.md`/`.js` the
  Write/Edit tools touch. The Bash tool mangles `$vars` and backslashes inside
  heredocs, so scripts go in a `.py` file written with the Write tool.
- **Verify by computed style, never by attribute.** `list.hidden === true` was "proof"
  while the list was visibly rendered (grid beat hidden). Read `getComputedStyle`.
- The Browser pane is a hidden document: `document.hidden` is true, so CSS transitions
  and rAF do not advance, `scrollTo` under `scroll-behavior: smooth` never moves, and
  lazy images report an empty `currentSrc`. Test end states with transitions disabled,
  or add the class by hand; test images with `new Image()`.
- Agent worktrees are cut from the session's cwd repo; if the session started in
  `~/.claude`, `isolation: worktree` gives agents the config repo, not the site.
  Pass the absolute path and no isolation.
- Local preview: launch config `dairydoctor` in `~/.claude/launch.json`, port 8123.
- Lighthouse: `CHROME_PATH` = Brave; local runs score 99 perf (no gzip) where live
  scores 100. chrome-launcher ends every run with an EPERM on its temp folder; the
  JSON is complete, ignore the exit code. `require('/c/...')` fails under node; use
  a Windows path or `cd` + `./`.
- `.hero .hl` needs `box-decoration-break: clone`; `.nav-row` must never be an
  overflow-x scroller; `[hidden]` is now `!important` site-wide, so anything meant to
  show while carrying `hidden` needs its own `!important` (print rules do).
- `git add` explicit paths only; `git fetch` and count `HEAD..origin` before pushing.
  `docs/HANDOFF-SNAPSHOT.md` is written by the compaction hook; leave it untracked.
