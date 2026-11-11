# CLAUDE.md: dairydoctor-site

Static website for Advanced Dairy Diagnostics & Consulting, LLC ("The Dairy Doctor"), Dr. Glenn
Pearson, DVM, Frederic, Wisconsin. Plain HTML pages, one stylesheet (`css/style.css`), two scripts
(`js/site.js`, `js/tools.js`). No build step and no package manager.

- Preview: GitHub Pages from `master` root. `dairydoctor.com` still points at the old host.
- Local preview: launch config `dairydoctor` (port 8123) in `~/.claude/launch.json`.
- Running state and gotchas: `docs/HANDOFF.md`. Current plan: `docs/plans/`.

## Hard constraints (kickoff interview 2026-11-11)

1. Never change, add or move a price. No price on the home page, no volume tiers, no selling on
   price. Prices are plain facts on the testing pages only: cattle and bison $3.50, goats and
   sheep $7.00, BVD PI $6.95.
2. Never present turnaround as an advantage or a race. Samples in by Wednesday are reported
   Thursday.
3. No other lab or company is named on the site. Regional voice, no national claims.
4. No DNS or domain change. Static hosting only: no backend, no paid service, no tracking script.
5. No online sample-submission form and no Spanish-language guides.
6. Nothing invented: no testimonial, number, credential, portrait or signature that is not real.
   No caption or alt text implies a pictured person is Dr. Pearson or a client.
7. Dr. Pearson's own claims and wording stay as written (first BioPRYN affiliate east of the
   Rockies, since 1999, and the technical statements on the BVD and tail-bleeding pages).
8. Copy is plain farm English: no em-dashes, no hype, no strategy talk on the page.
9. Brand stays: Sora headings, teal #336666, deep teal #244949, rust #B8430F, the engraved
   Holstein mark in its rectangular frame.
10. Look (Erik, 11 Nov 2026): photo-led and brighter. Photography in front, a lighter hero,
    better crops, bigger farm images. The hero shows a veterinarian or farmer working with
    animals, never a lone cow. Photographs are public domain or Creative Commons, with credits.
11. Existing page addresses never change. New pages are allowed where they earn it (Erik,
    11 Nov): goats and sheep, herd health consulting, beef and bison herds by mail, how results
    are read. Pages on Johne's, leukosis and mycoplasma wait for Dr. Pearson's answers.
12. Fixed facts: 362 310th Avenue, Frederic, WI; (715) 653-2201; fax (715) 653-4301;
    info@dairydoctor.com; staffed Monday to Friday 8 to 4 Central; tests run Monday to Thursday;
    lab closed to visitors; needle depth about 1/2 inch; goats and sheep are jugular-drawn;
    BVD PI testing is for cattle and bison only.
13. Testing: Lighthouse, axe and device sweeps run on localhost. Erik approved one live check of
    about 10 page loads after a push (11 Nov).
14. Done = three independent reviewers each score the site 95 or more out of 100 on the fixed
    rubric, local checks pass, the build is pushed to the preview, and every change has a
    written reason.

Added later:

15. 2026-11-11 (Erik): keep going until all three reviewers score 95 or more. No round cap and
    no stopping to ask between rounds; change approach if a round stalls.
