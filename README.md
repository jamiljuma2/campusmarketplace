# CampusMarket KE

Mobile-first campus classifieds for Kenyan students and local sellers. Next.js App Router, TypeScript, Tailwind CSS, Supabase and PayHero M-Pesa STK Push. The app name is configurable with `NEXT_PUBLIC_APP_NAME`.

## Current implementation

Included in this repository: email/password signup, login and reset; server-validated listing creation; image resizing and Supabase Storage upload; listing moderation state; PostgreSQL-backed listing search and filters; product details and seller-controlled public WhatsApp contact; seller dashboard and listing limits; subscription/promotion checkout against database prices; PayHero STK initiation, server-side transaction-status verification, idempotent purchase activation, payment event history; admin listing moderation and an initial overview; paid seller storefronts; participant-scoped in-app messaging with Realtime updates; Supabase RLS and storage policies; and unit tests for core billing rules.

This is an initial implementation, not a claim that all of the long-form brief is production complete. Notification delivery, student verification, seller contact preferences beyond public WhatsApp, comprehensive admin user/report/plan management, richer analytics, scheduled payment reconciliation, refunds, broader integration/E2E tests and a production security review remain to be completed. The expiry function needs an operator-configured scheduler. Do not enable production payments until the PayHero/Supabase setup and operational checks below are complete.

## Local development

1. Install Node.js 20.9+ and npm.
2. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon key. Keep the service role and PayHero credentials server-side.
3. In Supabase SQL Editor or the Supabase CLI, apply `supabase/migrations/202611070001_initial_schema.sql` to a fresh project.
4. Set up Auth email confirmation and the allowed redirect URL `http://localhost:3000/auth/callback`.
5. Run `npm install`, `npm run dev` and visit `http://localhost:3000`.

With Supabase missing, the home and public setup states render, but live product/auth/payment operations are intentionally unavailable. No sample products or simulated successful payments are seeded.

## Supabase production setup

- Create a project and apply migrations in order with the Supabase CLI (`supabase db push`) after linking the intended project. Back up production before schema changes.
- The migration creates the `product-images` public bucket with an 8 MB limit and JPEG/PNG/WebP input; upload ownership is restricted to a user-ID path prefix. The browser converts selected images to WebP before upload.
- Configure Auth email templates, SMTP, redirect URLs, password policy and abuse protections. Google OAuth is not wired in this initial implementation.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server route handlers and server actions. Never add it to a `NEXT_PUBLIC_` variable or browser bundle.
- A trusted operator must promote the first admin account from the Supabase SQL editor, after that account registers: `update public.profiles set role='admin' where id=(select id from auth.users where email='ADMIN_EMAIL');` Replace the address; do not run this from an untrusted client.
- University, campus and county tables are ready for controlled, database-managed seed data. They are empty in the initial migration; populate and verify the directory before onboarding users.
- The migration defaults to manual listing review. Admin pages require a trusted admin role. The public seller view exposes a phone number only when the seller enabled public contact.
- Schedule `select public.expire_paid_services();` with Supabase Cron/pg_cron once per hour, or an authenticated external scheduler. This function is not executable by public application roles.

## PayHero setup

Read the [official PayHero STK Push](https://docs.payhero.co.ke/docs/post-initiate-mpesa-stk-push-request), [callback structure](https://docs.payhero.co.ke/docs/payment-callback), [transaction status](https://docs.payhero.co.ke/docs/get-transaction-status) and [authorization](https://docs.payhero.co.ke/docs/authorization) docs. The current integration posts to `https://backend.payhero.co.ke/api/v2/payments` using HTTP Basic auth, `provider: m-pesa`, configured channel ID and callback URL. It verifies the resulting PayHero reference with `/api/v2/transaction-status?reference=...` before service activation.

PayHero posts to a Supabase Edge Function URL. Deploy `payhero-callback` from `supabase/functions/payhero-callback`; `supabase/config.toml` disables Supabase JWT verification for this provider callback. Set these Supabase Function secrets:

```sh
supabase functions deploy payhero-callback
supabase secrets set PAYHERO_CALLBACK_RELAY_SECRET="<shared-relay-secret>" CAMPUSMARKET_CALLBACK_FORWARD_URL="https://YOUR_DOMAIN/api/payments/payhero/callback"
```

Set `PAYHERO_API_USERNAME`, `PAYHERO_API_PASSWORD`, `PAYHERO_CHANNEL_ID`, `PAYHERO_CALLBACK_URL`, and the same `PAYHERO_CALLBACK_RELAY_SECRET` in Vercel. Set the callback URL to `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payhero-callback` with no token or query parameter. The Edge Function forwards the callback to the Vercel route with the shared relay secret. The Vercel route verifies that relay secret and independently checks the transaction with PayHero before activating any service. PayHero does not document a callback signature header, so callback contents alone never activate purchases. Use PayHero test credits/test channel first, then production credentials after end-to-end verification. Reconciliation can also be triggered by the signed-in user’s payment status page, which independently asks PayHero for transaction status.

Prices and plan limits are loaded from Supabase; edit plan rows through a future admin pricing screen or trusted SQL for now. No Daraja or alternate gateway is used. This application does not process marketplace item transactions; buyers arrange those directly with sellers.

## Vercel deployment

- Import the repository into Vercel; use the Next.js preset and production branch.
- Configure all `.env.example` variables in Preview and Production environments with separate credentials as appropriate.
- Set `NEXT_PUBLIC_APP_URL` and the Supabase Auth redirect/callback URLs to the deployed HTTPS domain.
- Deploy the Supabase callback function, configure its secrets, set Vercel’s callback URL and relay secret, and configure PayHero’s callback URL to the Edge Function. Verify the production payment channel, send a low-value end-to-end STK request, and verify callback + server-side status reconciliation and duplicate callback handling before launch.
- Check the deployment logs, email deliverability, database backup/restore plan, alerting, rate-limit/WAF rules for auth, listing and payment endpoints, and an administrator recovery procedure.

## Validation

`npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. Payment and database integration checks require a separate non-production Supabase project and PayHero test account; no live payment tests should be run against production without an operator-approved test procedure.
