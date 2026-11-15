# Masidy Production Runbook

The application code, schemas, protected workflows, cached public routes, and
provider adapters are production-oriented. Complete the external configuration
below before opening the site to users.

## Provider configuration

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin.
- Register the Google OAuth preview callback shown by Make and the published
  callback at `<published-origin>/api/auth/callback/google`.
- Register the Stripe webhook at `<published-origin>/api/payments/webhook`.
  Subscribe to checkout completion, connected-account updates, payouts, and
  charge disputes. Enable connected-account events.
- Configure a scheduler to `POST /api/cron/notifications` with
  `Authorization: Bearer <CRON_SECRET>` at least every 15 minutes.
- Configure Turnstile for the final hostname.
- Configure the private-file scanner endpoint to accept multipart field `file`
  with bearer authentication and return JSON `{ "clean": true }` only for a
  clean file.
- Verify the Resend sender domains used by `EMAIL_FROM` and
  `TRANSACTIONAL_EMAIL_FROM`.

Renaming the published site changes its origin. Re-publish and update Google,
Stripe, Turnstile, and any scanner allowlists after an origin change.

## Admin-managed launch values

Create and publish these records in Payload Admin:

- One active Finance Rule with platform fee, tax, currencies, invoice prefix,
  refund window, and terms note.
- Terms, Privacy, Cancellation, and Marketplace legal policies with approved
  versions and effective dates.
- Agency memberships connecting approved agency users to their agencies.
- Review and approve partner applications; approval activates the app role.

These are business and legal decisions and are intentionally not hard-coded.

## Operations

- Use `/api/health` for uptime checks.
- Alert on non-200 health responses and repeated webhook failures.
- Review failed notification records; the scheduler retries with exponential
  backoff up to five attempts.
- Review Security Events, Audit Logs, disputes, refund requests, data requests,
  and support tickets in Payload Admin.
- Verify Figma Cloud database and file-storage backup/restore policy before
  launch and run a restore exercise according to the organization’s retention
  requirements.
- Export reconciliation CSVs from the Finance workspace and reconcile them
  against Stripe before each payout close.

## Release verification

Run:

```sh
pnpm exec tsc --noEmit
pnpm test:smoke
figma make verify-deploy
```

Inspect the production route table: public fixed pages must be static or SSG/ISR,
while authenticated dashboards, APIs, and webhooks should remain dynamic.
