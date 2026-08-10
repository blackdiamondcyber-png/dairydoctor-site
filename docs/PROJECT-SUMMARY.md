# dairydoctor.com engagement summary

Date: 2026-08-10. Scope: full web-presence audit, industry/market analysis,
complete website rebuild, and growth strategy for Advanced Dairy Diagnostic &
Consulting, LLC (Dr. Glenn Pearson, DVM, Frederic WI) - all on free tooling.

## What shipped

- **Rebuilt website, live:** https://blackdiamondcyber-png.github.io/dairydoctor-site/
  - All 7 original pages at their original URLs (20 years of links preserved),
    plus a working contact.html (the old site's Contact link 404'd on every
    page) and a custom 404.
  - Lighthouse on the LIVE deploy: **100/100/100/100 mobile AND desktop**
    (old site: Perf 100 / A11y 64 / BP 63 / SEO 92 mobile). CLS 0.000, TBT 0ms.
  - CC0/public-domain photography, self-hosted Sora headings (see v4-v5 note
    below for the type history), scroll-reveal + counter + Ken Burns motion
    fully gated behind prefers-reduced-motion with a no-JS fallback; zero
    external requests; schema.org VeterinaryCare JSON-LD; sitemap; llms.txt;
    print styles for the how-to pages.
  - Hosting: GitHub Pages free tier (repo: blackdiamondcyber-png/dairydoctor-site).
- **DNS cutover runbook:** docs/DNS-CUTOVER.md - CRITICAL: email (MX) rides the
  old host at the apex; the runbook moves MX to mail.dairydoctor.com BEFORE
  the apex A-record change so info@dairydoctor.com never breaks.
- **Free presence playbook:** docs/FREE-RESOURCES.md - GBP claim (listings are
  fossilized as "Dairy Pharmacy Service"/pharmacy category across 6+
  directories in 3 towns), reviews, directory corrections, Bing Places,
  Search Console, BioTracking directory sync.
- **Two decision documents, published and verification-gated:**
  - Glenn presentation (before/after, plain-language traffic explainer,
    findings, competitor chapter, go-live checklist; 56 claims audited,
    44 confirmed, 2 refuted-and-corrected):
    https://claude.ai/code/artifact/b3d25095-683a-4c5a-8e97-2d89b97e9237
  - Erik growth strategy (industry audit, network price map, consulting-led
    plan, ranked moves, calendar; 44 claims audited, all refuted/overclaimed
    items corrected):
    https://claude.ai/code/artifact/b8bf7217-e7ce-4c3b-88f0-683a5bc336c4
  - Site QA crawl (12/12 pass):
    https://claude.ai/code/artifact/95416764-bac6-4f27-9021-a271c489ad1a
- **v3 imagery:** every page carries photography (WI dairy aerials, Jersey
  herd, calf; all CC0/public-domain, licensing in IMAGE-CREDITS.md).
  Lesson recorded: rawpixel's "image_1300" endpoint serves WATERMARKED
  previews; only the editor_1024 render is clean.
- **v4-v5 design refinement (Erik feedback + industry research):** headings
  now Sora (the face IDEXX runs; geometric sans dominates top vet brands per
  the 6-site typography study in the research archive). Hero headline:
  "One blood sample tells you which cows are open." Homepage is price-free
  (interior testing pages keep the old site's published prices pending
  Glenn's decision); trust strip deduplicated; a NEW custom logo (Holstein
  cow head with a blood-drop forehead star, images/logo.svg, sized for GBP
  at images/logo-512.png) serves as header mark + all favicons;
  accent #B8430F, AA-verified.
  Live Lighthouse after v5: homepage 100/100/100/100 both form factors, CLS 0.

## Blocked on Glenn (go-live gate)

1. PRICE CONFLICT: site says $3.25 cattle / $6.75 goat-sheep; BioTracking's
   directory says $3.50 / $5.75. Confirm which is current.
2. Testing days / turnaround wording (directory: Tue-Thu; site: ~48 hours).
3. Tail-bleeding needle depth "about 1/2 inch" - the old site's character was
   corrupted since at least 2012; value inferred from standard practice,
   needs the DVM's sign-off.
4. Official LLC name (5 variants in circulation).
5. Public hours, if any.

## Growth strategy headlines (full doc in the artifact)

- Market moment: beef herd smallest in 60+ years, cull cows $324/cwt (record),
  68.4% of cow-calf operations don't preg-test, blood testing only 3.5%.
- Don't price-fight Waupun ($2.75/same-day); sell the DVM-in-the-lab.
- Fix BVD PI price ($6.25 vs $2.55-3.95 market band).
- Launch prepaid sample kits (6 of 10 competitors sell them; ~$0.60-0.65
  consumables vs $4-5 market kit pricing).
- Own bison nationally (192,477 head, assay peer-validated, no competition)
  and goats regionally (WI #1: 78,000 head).
- Fall beef campaign Sep-Nov with the open-cow math; reactivate the 27-year
  client book.

## Research archive

All raw findings with source URLs live in the session scratchpad under
recon\ (technical, presence, competitors, industry, market) and verify\
(blind-verification verdicts). Key facts are duplicated into the two
published artifacts; this repo carries the operational runbooks.
