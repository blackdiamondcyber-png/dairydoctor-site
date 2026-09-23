# HANDOFF - dairydoctor-site

**Updated 2026-09-22 (late).** Read this first; the 2026-08-10 engagement record is in
`SESSION-HANDOFF-2026-08-10-full-engagement.md` and is still accurate for history.

## State right now

- Repo is **public with Pages enabled** from `master` root. It had gone private twice
  (cause unknown; Erik is reading his account security log, `action:repo.access`).
  Preview: https://blackdiamondcyber-png.github.io/dairydoctor-site/
- `dairydoctor.com` still serves the 2006 site from the old host over http. The public
  site was never on Pages. **No DNS change until Glenn says so.**
- Three builds shipped 22 Sep, all on `master`:
  1. `0a7e92a` Tier 1 repositioning (no new URLs, no price touched).
  2. `a77348d` + `501a8e0` ten interactive tools + twelve Commons/USDA photographs.
  3. `0725856` **ten-critic pass** (this handoff): every page reviewed by ten personas
     (large dairy manager, beef rancher on a phone, goat dairy owner, bovine DVM,
     WCAG auditor, performance engineer, copy editor, SEO, UX/Krug, compliance),
     149 findings triaged, about 120 applied. Details below.
- Live Lighthouse (mobile) after the critic pass: perf/a11y/BP/SEO: index 100/100/100/100 - pregtest 100/100/100/100 - bvdtest 100/100/100/100 - tailbleeding 100/100/100/100 - shipping_test 100/100/100/100 - faq 100/100/100/100 - aboutus 100/100/100/100 - contact 100/100/100/100 (run 22 Sep against 0725856)
- Reports for Erik: repositioning https://claude.ai/artifact/G6XM3qpezmjT1KbrxU6QRb ;
  field comparison + measured scores + critic summary
  https://claude.ai/artifact/JfS9VoM1dW8XqFcn9pEaSX

## What the critic pass changed (commit 0725856)

- **Species coverage.** Goats and sheep are drawn from the jugular vein (pregtest,
  tailbleeding, FAQ); BVD page and shipping cold-note say cattle and bison only;
  contact BVD checkbox labelled; box label offers CAPRINE/OVINE; titles on index and
  pregtest name goats and sheep.
- **Promises removed.** "Call ahead and we will arrange it" (index step 4, FAQ);
  "no charge for a sample we could not run" (FAQ); personal-inbox wording on
  contact and thanks; accuracy figures now say "BioTracking's published figure".
- **Structure.** FAQ grouped into four sections (21 questions, new consulting Q) with
  a lede, second photo, empty-state message, live match count; pregtest gains a jump
  row and `#pricing` `#start` `#forms` anchors and reads collect -> ship -> interpret;
  BVD program + planner moved above the science, test-the-dam step added; index gets
  a closing call/new-client CTA and a shorter hero lede (CTA now above the fold at
  375x812); tailbleeding gets restraint + stand-aside guidance, the needle step split
  in two (12 steps; SVG `data-step` numbers shifted), and the duplicate static list
  collapses behind a "Show all steps" toggle (prints in full via `@media print`).
- **Accessibility.** Distinguishable "Download PDF" names (`.sr-only`), `aria-current`
  on active menu triggers, stepper is `role=group` + `aria-describedby` + live text,
  FAQ count `aria-live`, copy button live region, autocomplete on contact fields,
  hero zoom is one 5 s pass, nav trigger opens on first press and follows its link on
  the second, scroll-reveal skips the fade for elements already on screen (`.now`),
  jump-row pills and badge links are 44px tall.
- **Performance.** 1000w band exports (`band-*-1000.jpg`) with `sizes="100vw"`,
  homepage card `sizes`, correct intrinsic dimensions (goats 900x601, bison 900x603,
  contact band 1100x825), `logo-lockup-600.jpg`, every lazy image `fetchpriority=low`.
- **Compliance.** `IMAGE-CREDITS.md` rows rebuilt from the Commons API (six were
  truncated HTML); footer names every CC BY-SA / CC BY photographer; `llms.txt` prices
  match the forms ($3.50 / $7.00 / $6.95); form `_next` is rewritten at runtime to the
  current host (works on the preview and after cutover); Google Maps button removed
  (lab closed to visitors); FormSubmit privacy note under the form; vCard NOTE folded.
- **Copy.** Sentence-case h2/h3 site-wide (h1 stays Title Case); "Dr. Pearson"
  everywhere on About; 2cc not "2 mL"/"Two cc"; Vacutainer vs vacuum tube settled;
  carriers list drops Airborne/DHL; "its clientele"; supplies checklist starts unchecked.

## Deliberately NOT changed (Glenn's rules or his own words)

- No price moved anywhere; no price put above the fold (rancher critic wanted it).
- Glenn's own claims stay: "first BioPRYN affiliate east of the Rockies", 70% subclinical,
  $35/cow study, Express FP10, Estroplan/Gonabreed, 3 to 6 inches, "15 years" + 1999,
  "Dr. Pearson is only a phone call away".
- No response-time window invented; no geo coordinates or sameAs guessed in JSON-LD;
  `VeterinaryCare` type kept (it is a veterinary practice).

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
- Agent worktrees are cut from the session's cwd repo; if the session started in
  `~/.claude`, `isolation: worktree` gives agents the config repo, not the site.
  Pass the absolute path and no isolation.
- Local preview: launch config `dairydoctor` in `~/.claude/launch.json`, port 8123.
  Browser-pane screenshots time out unless taken right after `navigate`; lazy images
  report `currentSrc` empty in the hidden pane, so test with `new Image()`.
- Lighthouse: `CHROME_PATH` = Brave; local runs score a few points under live (no
  gzip/CDN). `require('/c/...')` fails under node; `cd` into the folder and use `./`.
- `.hero .hl` needs `box-decoration-break: clone`; `.nav-row` must never be an
  overflow-x scroller; `html { scroll-behavior: smooth }` defeats scripted scrolling.
- `git add` explicit paths only; `git fetch` and count `HEAD..origin` before pushing.
