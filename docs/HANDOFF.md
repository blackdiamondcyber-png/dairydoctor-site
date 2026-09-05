# HANDOFF — dairydoctor-site

**Updated 2026-09-05.** Read this first; the 2026-08-10 engagement record is in
`SESSION-HANDOFF-2026-08-10-full-engagement.md` and is still accurate for history.

## State right now

- `master` is 2 commits ahead of origin and **cannot be pushed**: the GitHub token
  is invalid and the repo returns 404 unauthenticated (private or deleted; Pages
  requires public on the free plan, so the live site is down). Erik says he did
  not touch it. First job: `gh auth login`, then `gh repo view` / Settings ->
  Pages to see what happened, then push.
- `98465e2` applies Glenn's 15 Aug prices: goat/sheep **$7.00**, BVD PI **$6.95**,
  bison $3.50, no printed volume tiers ("call for a quote"), address **362**.
- `f77b55d` reframes the homepage around the veterinarian (hero photo of two vets
  with a calf, DVM-led lede, "Since 1999" stat, zero price lines) and swaps the
  BVD and Tail Bleeding bands for Carolyn Parsons' Holstein series. Verified
  locally: all asset refs resolve, no horizontal overflow at 375px.

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

- Which inbox he reads: he writes from `dairydoctor@reagan.com`; the site and the
  FormSubmit form use `info@dairydoctor.com`. Form is NOT activated. Do not guess.
- His "few changes" list.
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
