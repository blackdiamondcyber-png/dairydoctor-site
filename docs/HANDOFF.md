# HANDOFF - dairydoctor-site

Goal: a site Dr. Pearson is proud of and that sets his practice apart (full pass started 11 Nov 2026).

## START HERE (12 Nov 2026)

- After the scored build (12 Nov): the home hero is a generated illustration of a farmer on a
  call in the barn, with no caption on the page and a plain credit on `credits.html` (rule 16).
  A top-to-bottom UI pass followed: every corner is square (no `border-radius` except resets to
  0, no shadows), one double-rule frame for tools and cards, one rust-ruled callout, one type and
  spacing scale, square brand selects and checkboxes, a 3px focus ring on every control. No
  wording, price, fact or address changed. The reviewers have not scored this build.
  Checks after the pass: site check 16 pages 0 problems, tool tests 552 of 552, behaviour 483 of
  483, axe 0 violations, Lighthouse 98 to 100 on six pages. Spec and captures: `.work/2026-11-11/ui/`
  and `evidence/ui0` (before), `evidence/ui-final` (after).
- Review rounds on the new look (12 Nov): round 6 on the UI pass scored 94.5 / 96 / 94.5, so a
  fix round followed (beef cattle photo, full-width BVD band, print footers, hours, wording,
  lighter hero files, contact details as one ruled list). Round 7 scored 97 / 97 / 96.5. Four
  small catches from round 7 were fixed afterwards and are not re-scored. Tool tests are now
  554. Still open, by choice: a new hero illustration (Erik's pick), goat and sheep photographs,
  the drawing label typeface on Android, the advice line when the day before ship day is a
  holiday, empty cells in three-field tools, the no-script timing text.
- Where it stopped (12 Nov, afternoon): the build work is done and the session was archived.
  `full-pass` and `master` are both at `2f82768`, live on the preview. A follow-up email to
  Dr. Pearson sits as an unsent draft in Erik's Gmail ("Dad, the website preview is updated");
  Erik is texting him first. Next session starts from Dr. Pearson's replies or from Erik's pick
  of a new hero picture, not from another build round.
- Round 8 (12 Nov, no items set aside): 98 / 96 / 97 on commit `6317028`, after a fix round
  that built the deferred items (wording, holiday shipping advice, tool layout, a new sheep
  photograph, a lifted parlour photograph, drawing labels as outlines, lighter hero files).
  One line was fixed after scoring (overnight advice after a holiday). Tool tests are now 557.
  Still open: the jugular photograph on the goats page, the round plate photo on results, the
  parlour photo crop, drawing label size on phones, a credits line for the drawing lettering,
  the footer photo sentence, source links for two figures, and a new hero (Erik's pick).
- Constraints: `CLAUDE.md`, "Hard constraints" (16 items). Plan: `docs/plans/2026-11-11-full-pass.md`.
- State: `full-pass` and `master` hold the same site build, commit `1a1ba45` (round 5). Erik
  sent Dr. Pearson the preview link on 11 Nov, so every build that passes the local checks goes
  to `master` as well (fast-forward, push, one live check of about 10 page loads).
- The score bar is met. Review scores by round (customer, brand, technical): 74 / 80.5 / 82,
  84.5 / 90 / 88, 93 / 88 / 93, 95 / 92 / 95, and round 5: 96.5 / 97.5 / 97.
- The build: 16 pages (15 public plus `herd-list.html`, a printable animal list sheet that is
  deliberately unlinked and noindex until Dr. Pearson agrees to take list sheets), four menus,
  "Submission forms" in every menu and footer, a contact form that takes a phone number or an
  email, a printable barn card, date tools that know postal and carrier holidays, one cow mark
  in header, footer, favicons and the share card, seven engraved drawings, a text footer.
- Local checks on `1a1ba45`: site check 16 pages, 0 problems; tool tests 552 of 552; behaviour
  checks 483 of 483; axe 0 violations at 375 and 1280 px; Lighthouse 99 to 100 (`thanks.html`,
  `404.html` and `herd-list.html` are noindex on purpose); live check 10 of 10.
- Not done, by choice: about nine small items the reviewers still took half a point for (beef
  page has no beef cattle photograph, BVD band width, a few wording lines, drawing label
  typeface on Android, footer hours wrapping). The scored build was left as scored.
- Not verified: a real Android phone; the contact form relay (it needs a one-time confirmation
  click at the lab's inbox before messages arrive).
- Waiting on Dr. Pearson: his answers to the question list Erik holds (inbox, bison day count,
  handling limits, closed days, list sheets, what consulting delivers, his own photographs,
  sources for his figures, and whether the pages may go on his existing host with no DNS change).
- Working files live in `.work/` on the G7 only (git-ignored): `.work/2026-11-11/STATE.md`
  (running state), `closeout/` (the change list written for Dr. Pearson and the change log).
- Tool arguments: `behavior_check.js`, `shoot.js` and `lh_run.py` take page names WITHOUT
  `.html`.
- Capturing pages: take slices by scrolling inside the viewport. Capturing beyond the viewport
  makes the browser pick `<picture>` sources again and the art-directed photos come out blank.
- Lighthouse on this machine: call the cached CLI with `node`; `npx --no-install lighthouse`
  exits without writing a report. The plain preview server sends no gzip and `no-store`, which
  costs two flags that GitHub Pages does not have.

## History

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
