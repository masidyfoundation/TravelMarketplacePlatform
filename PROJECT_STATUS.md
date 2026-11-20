# Masidy Project Status

## Current state

Masidy is a production-oriented Next.js, Payload, Tailwind CSS, and Figma Make
travel marketplace. The application code is complete through the five roadmap
phases in `MASIDY_TODO.md`.

The current application version is recorded as **Make version 7**, commit
`6d344cc6d5a4253235ec56b63739f6e4236ac59b`.

## Implemented

### Marketplace and accounts

- Responsive public marketplace for mobile, tablet, and desktop
- Payload-managed trips, agencies, media, departures, reviews, and availability
- Public trip, agency, agent-storefront, legal-policy, and AI-published pages
- Google and passwordless email app authentication
- Separate Payload Admin and public app-user authorization
- Traveler wishlists and protected traveler, agent, and agency workspaces
- Partner applications, review status, resubmission, and staff-controlled role activation
- Guest demo for traveler, agent, and agency workflows

### Booking operations

- Dated capacity and agency inventory management
- Agent storefront curation and attributed links
- Proposals and quotations
- Expiring reservation holds
- Stripe Checkout order creation
- Waitlists, amendments, cancellations, refund requests, and vouchers
- Traveler details, emergency contacts, and private scanned document uploads
- Booking-participant conversations and secure messages
- Notification center, scheduled reminders, email delivery, and retry processing

### Finance

- Stripe Connect onboarding for agents and agencies
- Policy-driven platform fees and taxes
- Agent commission and agency-net calculations
- Idempotent Stripe transfers
- Finance ledger and reconciliation CSV export
- Invoices, payout statements, refunds, partial refunds, reversals, and disputes
- Multi-currency finance rules
- Finance dashboard

### Masidy Make AI

- OpenAI generation with moderation and daily usage limits
- Usage and estimated-cost records
- Role-aware private workspace context
- Inventory enrichment and pricing intelligence
- Trip matching, proposals, campaigns, itineraries, and support assistance
- Structured editable page sections
- Live page preview and publishing
- Brand kits, templates, version snapshots, and cached public pages

### Trust and launch infrastructure

- Persistent rate limiting
- Cloudflare Turnstile integration
- Private-file scanner adapter
- Audit logs and security events
- Consent preferences
- Data export and verified account-deletion requests
- Editable Terms, Privacy, Cancellation, and Marketplace policies
- Health endpoint, robots, sitemap, metadata, and structured data
- Locale, preferred currency, and time-zone preferences
- Smoke, authorization, webhook-rejection, accessibility-semantic, and load-burst checks
- Production operations runbook

## Verified

The following checks passed after the final implementation:

```text
pnpm exec tsc --noEmit
pnpm test:production
figma make verify-deploy
```

Verification results:

- Payload bootstrapped with 49 application and platform collections.
- The production build completed successfully.
- Homepage, demo, sitemap, robots, all generated trip pages, and all generated
  agency pages returned HTTP 200.
- Protected dashboards, onboarding, and Studio redirected anonymous users to login.
- The health endpoint returned HTTP 200.
- Production artifacts contained live Patagonia departure inventory.
- Trip artifacts contained schema.org structured data.
- Public fixed routes were Static or SSG/ISR in the production route table.
- Authenticated dashboards, APIs, webhooks, and provider callbacks remained dynamic.
- The 20-request homepage load burst passed the five-second p95 threshold.

## Still required before going live

No additional product feature implementation is currently planned. The
remaining work consists of provider secrets, provider-console registration, and
business-owned launch values.

### 1. Complete Make secrets

Open **Make settings → Secrets** and provide:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `APP_OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `TRANSACTIONAL_EMAIL_FROM`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `FILE_SCAN_API_URL`
- `FILE_SCAN_API_KEY`
- `CRON_SECRET`

Do not paste secret values into chat, source code, Payload records, or public
environment variables.

### 2. Register provider callbacks

- Google preview callback:
  `https://preview-oauth.figma.site/callback`
- Google published callback:
  `https://<published-origin>/api/auth/callback/google`
- Stripe webhook:
  `https://<published-origin>/api/payments/webhook`
- Configure Stripe checkout, connected-account, payout, and charge-dispute events.
- Enable connected-account webhook events.
- Register the published hostname in Turnstile.
- Verify the Resend sender domains.

If the published site is renamed, update the published callback and webhook
origins and re-publish.

### 3. Configure scheduled processing

Schedule the following request at least every 15 minutes:

```text
POST https://<published-origin>/api/cron/notifications
Authorization: Bearer <CRON_SECRET>
```

### 4. Enter business and legal values

In Payload Admin at `/admin`:

- Create one active Finance Rule.
- Set the approved platform fee, tax/VAT, supported currencies, invoice prefix,
  refund window, and finance terms.
- Create and publish approved Terms, Privacy, Cancellation, and Marketplace policies.
- Connect approved agency users through Agency Memberships.
- Review partner applications and approve valid partners.

These values require business or legal approval and are intentionally not
hard-coded.

### 5. Perform live provider checks

After secrets and callbacks are configured, test:

1. Google login and passwordless email login
2. Traveler, agent, and agency access
3. Turnstile-protected booking request
4. Private document upload and scanner response
5. Stripe test checkout and signed webhook
6. Reservation conversion and voucher creation
7. Agent and agency Connect onboarding
8. Commission and agency transfers
9. Full and partial refund processing
10. Dispute and payout webhook records
11. Transactional email and scheduled reminder delivery
12. OpenAI generation, moderation, editing, and publishing

### 6. Publish and operate

- Publish from Figma Make.
- Monitor `/api/health`.
- Configure an external uptime alert for non-200 responses.
- Confirm the Figma Cloud backup, retention, and restore policy.
- Run a backup restore exercise according to organizational requirements.
- Reconcile the Finance CSV against Stripe before payout close.

## Source and management

- Product roadmap: `MASIDY_TODO.md`
- Launch and operations instructions: `PRODUCTION_RUNBOOK.md`
- Current status and handoff: `PROJECT_STATUS.md`
- Marketplace and app pages: `src/app/(frontend)/`
- Payload collections: `src/collections/`
- Payload Admin: `/admin`
- Application preview: Figma Make Preview
- Deployment: Figma Make Publish

The one intentionally open roadmap item is **Production domain and provider
callback registration**, because it must be completed in external provider
consoles after the final published origin is known.
