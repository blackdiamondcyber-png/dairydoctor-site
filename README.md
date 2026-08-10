# dairydoctor.com - Advanced Dairy Diagnostic & Consulting, LLC

Modernized static website for Dr. Glenn Pearson, DVM (Frederic, WI): a BioPRYN
affiliate lab offering mail-in pregnancy testing for cattle, bison, goats and
sheep, plus BVD, Johnes, Leukosis and Mycoplasma disease monitoring. Clients
in all 48 contiguous states.

- **Stack:** plain static HTML/CSS + ~4KB vanilla JS (nav dropdowns plus
  scroll reveals gated behind prefers-reduced-motion), zero build step, no
  page-load external requests (the contact form posts to formsubmit.co only
  on submit)
- **Hosting:** GitHub Pages (free, HTTPS)
- **Palette:** carried forward from the original site and modernized - deep
  teal `#336666`, teal links `#006666`, ember accent `#B8430F`, white/mint
  fields. Headings set in Sora (self-hosted, OFL); body is the system sans stack
- **Brand system (2026):** a vintage public-domain engraved Holstein in three
  formats - the header emblem `images/header-mark.png` (cream label rectangle,
  teal keyline, blood drop above the cow, ADDC lettering), matching square
  favicons (`favicon-48.png`, `favicon-180.png`, `favicon.svg`, and
  `images/logo-512.png` for the Google Business Profile), and the full
  wordmark lockup `images/logo-lockup.jpg` used on the About page and in print
- **New-client form:** contact.html posts to FormSubmit (free); one-time
  activation click required at info@dairydoctor.com - see
  `docs/FREE-RESOURCES.md`
- **Original site assets:** `assets/original/` (reference copies of the 1999-era site)

## Local preview

Open `index.html` directly, or serve the folder with any static server.

## Deploy

Pushed to GitHub with Pages enabled on `master`; every push deploys.
DNS cutover runbook for pointing dairydoctor.com here: `docs/DNS-CUTOVER.md`.
