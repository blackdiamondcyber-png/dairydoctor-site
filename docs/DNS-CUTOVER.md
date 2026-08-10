# DNS cutover runbook: dairydoctor.com -> GitHub Pages

Goal: point the domain at the new GitHub Pages site WITHOUT touching email.
info@dairydoctor.com is served by the same box that hosts the old website
(72.52.241.164, FireWebsiteHosting on Liquid Web). MX currently points at the
APEX domain itself, so changing the apex A record naively would route mail to
GitHub and break it. The order below prevents that.

## Current state (verified 2026-08-10)

| Record | Value |
|---|---|
| A `dairydoctor.com` | 72.52.241.164 (old host: web + mail + DNS) |
| CNAME `www` | dairydoctor.com |
| MX | `dairydoctor.com` (pref 0)  <- the landmine |
| TXT (SPF) | `v=spf1 +a +mx +ip4:72.52.241.164 ~all` |
| TXT `_dmarc` | `v=DMARC1; p=none;` |
| NS | ns7/ns8.firewebsitehosting.com (DNS edits happen in the FireWebsiteHosting panel) |

The old host's TLS cert already includes SAN `mail.dairydoctor.com`, so the mail
hostname below is expected to work with TLS as-is.

## Phase 1 - detach mail from the apex (do this FIRST, days before the cutover)

1. In the FireWebsiteHosting DNS panel, ADD: `A mail.dairydoctor.com -> 72.52.241.164`.
2. Change MX from `dairydoctor.com` to `mail.dairydoctor.com` (keep preference 0 or 10).
3. If email is fetched as POP/IMAP `dairydoctor.com`, change the mail client's
   server names to `mail.dairydoctor.com` now (works immediately, and keeps
   working after cutover).
4. Wait 24-48h (TTL), then test: send an email TO info@dairydoctor.com from
   outside (Gmail), confirm receipt; send one FROM info@, confirm delivery and
   that it does not land in spam.

Do not proceed to Phase 2 until Phase 1 tests pass.

## Phase 2 - point the web at GitHub Pages

5. In the GitHub repo (blackdiamondcyber-png/dairydoctor-site), add a file named
   `CNAME` containing exactly one line: `dairydoctor.com` - or set the custom
   domain in Settings -> Pages. (Do NOT add this file before Phase 2; while the
   custom domain is configured but DNS is not, the *.github.io preview URL
   redirects to the not-yet-live domain.)
6. In the DNS panel, REPLACE the apex A record with GitHub Pages' four IPs:
   185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   (four separate A records). Delete the old 72.52.241.164 apex A record.
7. Change `www` CNAME target to `blackdiamondcyber-png.github.io`.
8. In GitHub Settings -> Pages: wait until the custom domain shows a green
   check and the certificate is provisioned (minutes to ~1 hour), then enable
   "Enforce HTTPS".

## Phase 2b - form redirect

9. After the domain is live, edit contact.html: change the form's hidden
   `_next` input from the github.io thanks-page URL to
   `https://dairydoctor.com/thanks.html`, commit, push.

## Phase 3 - verify

- https://dairydoctor.com loads the new site with a valid padlock
- http://dairydoctor.com redirects to https
- https://www.dairydoctor.com redirects to the apex
- Old deep links return 200: /aboutus.html, /pregtest.html, /faq.html,
  /shipping_test.html, /tailbleeding.html, /bvdtest.html and all three PDFs
- Email still flows both directions (repeat the Phase 1 test)

## Rollback (any time, ~minutes plus TTL)

- Restore apex A -> 72.52.241.164, restore `www` CNAME -> dairydoctor.com,
  remove the CNAME file from the repo. Mail is unaffected either way once MX
  points at `mail.dairydoctor.com`.

## Cost notes

- GitHub Pages hosting + certificate: $0, indefinitely.
- The FireWebsiteHosting account must STAY ACTIVE: it still runs the lab's
  email (and DNS). Canceling that account would kill info@dairydoctor.com.
  Moving email to a dedicated provider is a separate, optional, later project.
- Optional hardening while in the DNS panel: tighten SPF to
  `v=spf1 mx ip4:72.52.241.164 ~all` and DMARC to `p=quarantine` AFTER a few
  weeks of confirmed-clean mail flow. Not required for the cutover.
