# dairydoctor.com — Advanced Dairy Diagnostic & Consulting, LLC

Modernized static website for Dr. Glenn Pearson, DVM (Frederic, WI) — BioPRYN affiliate
lab offering mail-in pregnancy testing for cattle/bison plus BVD, Johnes, Leukosis and
Mycoplasma disease monitoring. Clients in all 48 states.

- **Stack:** plain static HTML/CSS + ~2KB vanilla JS (scroll reveals, gated
  behind prefers-reduced-motion), zero build step, zero external requests
- **Hosting:** GitHub Pages (free, HTTPS)
- **Palette:** carried forward from the original site and modernized - deep
  teal `#336666`, teal links `#006666`, ember accent `#B8430F`, white/mint
  fields. Headings set in Sora (self-hosted, OFL); body is the system sans stack
- **Logo/favicon:** custom mark created for the lab (images/logo.svg): a
  Holstein cow head with an ember blood-drop forehead star, on the brand teal.
  images/logo-512.png is sized for the Google Business Profile avatar
- **Original site assets:** `assets/original/` (reference copies of the 1999-era site)

## Local preview

Open `index.html` directly, or serve the folder with any static server.

## Deploy

Pushed to GitHub with Pages enabled on `master` — every push deploys.
DNS cutover runbook for pointing dairydoctor.com here: see `docs/DNS-CUTOVER.md`.
