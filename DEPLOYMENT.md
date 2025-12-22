# Malta CV Directory – Production Deployment Guide

## Environment variables
Copy `.env.example` to `.env.local` for local dev and set secrets in Vercel Project Settings → Environment Variables.

- `NEXT_PUBLIC_SUPABASE_URL` (from Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon)
- `SUPABASE_SERVICE_ROLE_KEY` (service key; **server-side only**)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` (**server-side only**)
- `STRIPE_WEBHOOK_SECRET` (from Stripe CLI/Dashboard endpoint)
- `SITE_URL` (e.g., https://yourdomain.com)
- `UNLOCK_PRICE_EUR`, `BOOST_PRICE_EUR`
- `STRIPE_UNLOCK_PRICE_ID`
- `STRIPE_SUB_LIMITED_PRICE_ID`
- `STRIPE_SUB_UNLIMITED_PRICE_ID`

## Supabase setup
1) Create project, grab URL + keys.
2) Apply SQL: run `supabase/schema.sql` in SQL Editor (includes tables, RLS, storage policies, view).
3) Storage: ensure `cv-files` bucket exists (insert is in the SQL). Confirm RLS policies applied.
4) Auth: enable email/password; configure site URL and redirect for magic links if used.
5) Service role: store `SUPABASE_SERVICE_ROLE_KEY` in Vercel (server only).
6) Insert subscription plans:
   ```sql
   insert into public.subscription_plans (plan_code, name, description, price_cents, currency, interval, unlocks_included, boosts_included)
   values
   ('limited', 'Limited CV unlocks', 'Includes a capped set of unlocks', 0, 'eur', 'month', 10, 0)
   on conflict (plan_code) do update set unlocks_included = 10;
   insert into public.subscription_plans (plan_code, name, description, price_cents, currency, interval, unlocks_included, boosts_included)
   values
   ('unlimited', 'Unlimited CV access', 'Unlimited unlocks monthly', 0, 'eur', 'month', 0, 0)
   on conflict (plan_code) do nothing;
   ```
   Adjust price_cents to mirror Stripe prices if you want internal tracking.
7) RLS: All tables created with RLS ON. Verify:
   - `profiles`, `jobseeker_profiles`, `jobseeker_contacts`, CV sub-tables, `unlocked_contacts`, `payments`, `employer_subscriptions`, `moderation_flags` have policies.
   - Storage policies limit uploads to `auth.uid()/...` and allow service-role read.

## Stripe setup
1) Create three prices/products:
   - Pay-per-unlock (one-time): set `STRIPE_UNLOCK_PRICE_ID`.
   - Subscription limited: monthly price, set `STRIPE_SUB_LIMITED_PRICE_ID`.
   - Subscription unlimited: monthly price, set `STRIPE_SUB_UNLIMITED_PRICE_ID`.
2) Set webhook endpoint: `https://yourdomain.com/api/webhooks/stripe` for events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Save `STRIPE_WEBHOOK_SECRET`.
3) Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
4) Ensure metadata keys in products/prices are not required—code sets metadata on session/subscription.

## Vercel deployment
1) Push code to GitHub/GitLab; create Vercel project from repo.
2) Add env vars (see above) to Vercel (Production and Preview). Keep service and Stripe secret keys as secret scope.
3) Set `SITE_URL` to your Vercel domain or custom domain.
4) Deploy; Vercel will build Next.js App Router with Tailwind/TS.
5) After deploy, run Stripe CLI to test webhook or add live webhook from Dashboard.

## Security & data protection
- **RLS enforced**: All tables use RLS; service-role only where needed (payments/unlocks/moderation inserts). Do not expose service key to the browser.
- **Authz**: Middleware guards jobseeker/employer/admin routes; server-side `requireRole` on sensitive pages; admin APIs double-check `profiles.role`.
- **Contact gating**: Contact info in `jobseeker_contacts` is separate; only unlocked employers or owners can read via RLS.
- **Soft deletes**: PII tables use `deleted_at`; avoid hard deletes to stay GDPR-friendly.
- **Storage**: CVs stored in private bucket `cv-files` under `auth.uid()/...`; only owners or service role can read.
- **Webhooks**: Stripe webhook uses signature verification; process on server only. Keep `STRIPE_WEBHOOK_SECRET` private.
- **Input validation**: Client forms use zod; serverside queries filter by `deleted_at` and visibility.
- **Least privilege**: Use anon key on client; service key only in API routes / server actions.

## Smoke-test checklist post-deploy
- Signup/login works for jobseeker and employer; roles stored in `profiles`.
- Jobseeker can create/edit CV, upload PDF; visibility respects hidden/public.
- Employer search returns CVs; unlock button redirects to Stripe and unlocks after webhook.
- Subscription checkout starts and webhook creates/updates `employer_subscriptions`.
- Admin dashboard accessible only to admins; can flag/hide/unhide CVs.
