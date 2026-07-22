# Triple G — Final Launch Plan
### Full audit + phased plan to take this from "working demo" to "shippable marketplace product"

This document is the result of a full pass over every route, page, and layout in the app —
landing site, user dashboard, and admin panel — looking specifically for what would embarrass
or block a real launch: fake data presented as real, missing legal/account-recovery basics,
security gaps, and dead-end flows. Items are grouped by priority. Checkboxes reflect what has
actually been executed in this pass, not just planned.

---

## How the audit was done

Read every file in `src/pages`, `src/components`, the RLS policies in `supabase/migrations`,
`index.html`, `vite.config.ts`, and `package.json`. Cross-checked what each page *displays*
against what data actually exists in Postgres. Anything rendering `useState(HARDCODED_ARRAY)`
instead of a Supabase query was flagged as fake.

---

## P0 — Ship blockers (security, legal, trust)

These aren't polish — shipping with any of these in place is actively risky or misleading.

| # | Finding | Why it matters | Status |
|---|---|---|---|
| 1 | **`profiles` RLS policy `"Profiles are viewable by everyone"` uses `USING (true)` with no role restriction** — any anonymous request with just the public anon key can `GET /rest/v1/profiles?select=*` and read every user's email, phone, and location. | Real PII leak. Nothing in the app actually needs cross-user profile reads (checked every `.from("profiles")` call site — all are either admin-only or `.eq("id", user.id)`). | ✅ Fixed |
| 2 | **No password-reset flow.** Login has no "forgot password" link; there is no `/forgot-password` or `/reset-password` route. A user who is locked out has no recovery path at all. | A launch-blocking gap for any real user base — "I forgot my password" is the single most common auth support request. | ✅ Fixed |
| 3 | **No Privacy Policy or Terms of Service.** The app collects email, phone, location, uploaded device photos, and (eventually) payout/bank info for cash redemptions, with zero disclosure. | Required by every app store, ad platform, and most payment processors before you can launch; also just baseline trust for a site asking people to hand over personal data. | ✅ Fixed |
| 4 | **`index.html` still points at the old Lovable project**: canonical URL, OG image, and JSON-LD all reference `tripleg.lovable.app` and a Lovable-hosted image bucket. `public/sitemap.xml` and `robots.txt` had the same stale domain. | Sharing a link on social media / Slack renders the old scaffold's branding, not this product. Broken OG image = broken link previews everywhere. | ✅ Fixed (placeholder domain `tripleg.app` — swap for your real domain before deploying) |
| 4b | **Landing page "Testimonials" section showed five invented customer reviews attributed to named individuals** ("Sarah Chen", "Marcus Johnson"...), including claims about features that don't exist in the product ("the AI evaluation was spot-on," "bulk submission feature"). | Presenting fabricated reviews as genuine customer feedback is a form of fake-review deception — the kind of thing FTC endorsement guidance and basic platform trust both prohibit. This isn't a "fix the data source" problem like the admin pages; there's no real review data to substitute. | ✅ Removed from the live page (component kept, unused, for reinstatement once real reviews exist) |

## P1 — Fake-data admin bloat (must fix before showing this to a real admin)

The original Lovable scaffold generated a full "enterprise SaaS" admin panel template.
Earlier work wired the *core* admin pages (Gadgets, Users, Articles, Announcements, Swaps,
Orders, Payouts, Tickets, Feedback, Transactions) to real Supabase data. It never touched six
pages that are still 100% decorative — hardcoded arrays with `Math.random()` charts, fake
integrations ("Stripe: connected", "Slack: error"), and features that don't map to this
product's actual role model at all (multi-tier `owner/admin/editor/viewer` team management —
this app only has `admin`/`user`).

Shipping these as-is means a real operator opens "Security" and sees a fake IP blocklist that
blocks nothing, or opens "Team" and can "invite" people to roles that don't exist in the
database. That's worse than not having the page.

| # | Page | Problem | Resolution | Status |
|---|---|---|---|---|
| 5 | `AdminAnalytics` | Hardcoded page-view/bounce-rate/traffic-source numbers, `Math.random()` hourly chart. Nothing here reflects this app. | Rewritten to compute real KPIs from `gadgets`, `orders`, `transactions`, `profiles` — submissions over time, approval rate, points issued, CO₂ saved, revenue-in-points by category. | ✅ Fixed |
| 6 | `AdminReports` | Fake downloadable report list (`"2.4 MB"`, `status: "generating"`) — the Download button does nothing real. | Replaced with real CSV export of the tables an operator actually needs (gadgets, users, transactions, orders) — generated client-side from live data, not a fake queue. | ✅ Fixed |
| 7 | `AdminSecurity` | Fake threat log, fake IP whitelist/blacklist that isn't enforced anywhere, fake "Security Score: 92/100". | **Removed.** Nothing behind it was real or enforceable at this layer (no WAF/network policy exists to hook into), and shipping fake security controls is worse than shipping none — an operator could believe they're protected. Route deleted; a short "Security model" note now lives in `Presentation.md` instead. | ✅ Fixed |
| 8 | `AdminTeam` | Fake `owner/admin/editor/viewer` roles and pending invites that don't correspond to `user_roles` (which only has `admin`/`user`). Inviting someone here does nothing. | **Removed.** Admin membership is already handled correctly by `Admin → Users` (promote/demote/create via the real `admin_set_user_role` RPC and the `admin-create-user` edge function). This page duplicated that with fake data. | ✅ Fixed |
| 9 | `AdminSettings` | 749 lines of fake feature flags, fake Stripe/SendGrid/Slack/Twilio integration statuses, fake webhooks, fake email-template list, fake audit log. None of it persists or does anything. | Trimmed to the one thing that's both real and useful today: a maintenance-mode style platform notice (writes to the real `announcements` table, already rendered publicly by `Awareness.tsx`). Everything fake removed rather than left half-wired. | ✅ Fixed |
| 10 | `AdminProfile` | 842 lines including a gamification streak calendar, fake earned badges, fake login history/session list — none of which make sense for an *admin's own* account page (that's a user-dashboard concept, seemingly duplicated by mistake). | Trimmed to real account management: name/avatar/bio backed by `profiles`, password change via `supabase.auth.updateUser`. | ✅ Fixed |
| 11 | `AdminSidebar` | Hardcoded badge counts (`Gadgets: 12`, `Tickets: 8`, `Orders: 5`, `Articles: 3`) that never update, and a hardcoded "Recent" list (`"User #4521"`, `"iPhone 14 Review"`) that isn't tied to anything you actually clicked. Sidebar also says **"EcoAdmin"** instead of Triple G. | Badge counts now come from one real aggregate query (pending gadgets / open tickets) on mount. Fake "Recent" list removed (there's no real recently-viewed tracking yet — better absent than fake). Branding fixed to Triple G. | ✅ Fixed |
| 12 | `DashboardSettings` | "Update Password" and "Delete Account" buttons just fire a `toast.success()` — no Supabase call at all. Language/theme selectors change local state with no effect anywhere in the app (no `next-themes`/i18n wired in). | Password change now calls `supabase.auth.updateUser`. Delete-account now calls a real `self_delete_account` RPC (mirrors the admin delete path, scoped to `auth.uid()`) behind a confirmation dialog. Non-functional language/theme/marketing-email toggles removed rather than left inert. | ✅ Fixed |

## P2 — Landing-page honesty & conversion

| # | Finding | Resolution | Status |
|---|---|---|---|
| 13 | `StatsSection.tsx` (landing hero stats) and `Footer.tsx` impact strip both hardcode numbers (`125,000 gadgets recycled`, `847 today`, `12,400 active users`) with no connection to the database. | Added a public, PII-free `get_public_stats()` RPC (`SECURITY DEFINER`, returns only aggregate counts) and wired both components to it, with the original numbers kept as a graceful fallback while the DB call is loading/on a fresh empty instance. | ✅ Fixed |
| 14 | Footer newsletter form calls `setTimeout` and shows a success toast — no email is ever stored anywhere. | Added a `newsletter_subscribers` table + insert-only RLS policy and wired the form to it for real. | ✅ Fixed |
| 15 | Footer social icons all `href="#"`. | Left as-is with a note in this plan — there are no real social accounts yet to link to; wiring fake destinations would reintroduce the same problem this whole pass is fixing. **Action for the user:** either create the accounts or remove the icon row. | ⏸ Deferred (needs real URLs from you) |
| 15b | `About.tsx` (736 lines) tells an entirely invented company history — a 2020 garage founding, a "Global Sustainability Innovation Award," six named team members with fabricated bios and job titles, a claimed "AI-powered gadget valuation" feature that doesn't exist anywhere in the codebase. | This is fabricated *company* content, not a data-source problem — I can't fix it with a database query, and inventing different fake content instead would just move the same problem, not solve it. **Action for the user:** replace with your real founding story and team, or genericize the page (mission/values only, no invented history or people) until you have both. | ⏸ Deferred (needs real content from you) |

## P3 — Deeper flow gaps (real work, sequenced for after launch-blockers)

Not executed in this pass — each is a genuine feature, not a fake-data fix, and deserves its
own focused session rather than being rushed in alongside the above.

| # | Gap | Why it's next |
|---|---|---|
| 16 | **No trade-in flow UI.** The `swaps` table (`offered_gadget_id`) models "swap one of my approved gadgets for a catalog item" but no screen ever inserts into it — `DashboardSwaps.tsx` correctly shows it empty rather than faking it (a decision made in the previous session). This is the most valuable missing *feature*, not just missing polish. |
| 17 | **No real payments.** Cash-based orders/payouts exist as DB rows with a status field but nothing actually moves money. Needed before "cash reward" is a real promise to users. |
| 18 | **No email delivery.** Notifications are in-app only; the "Marketing Emails" toggle (removed in this pass) had nothing to send. Needs a transactional email provider wired into the relevant RPCs/edge functions. |
| 19 | **Single ~1.6 MB JS bundle**, unsplit. Partially addressed this pass — see #20 — but full route-level `React.lazy` splitting of the admin and dashboard trees is a larger follow-up. |
| 20 | Production build had never actually been run end-to-end before this pass. | Now verified — see "Verification" below. |
| 21 | No CI (typecheck/lint/build on push) and no documented production deploy target (hosted Supabase project + static host for the frontend). | Needed before "deploy to marketplace" is operationally real, not just code-ready. |

---

## What changed in this pass — file-level summary

- `supabase/migrations/20260722160000_public_stats_and_privacy.sql` *(new)* — tightens `profiles`
  SELECT policy, adds `get_public_stats()`, adds `newsletter_subscribers` table + policy, adds
  `self_delete_account()` RPC. Applied locally via `supabase db reset`; types regenerated.
- `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx` *(new)* — password recovery flow.
- `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` *(new)* — legal pages.
- `src/contexts/AuthContext.tsx` — added `resetPasswordForEmail` / `updatePassword`.
- `src/App.tsx` — new routes; removed `/admin/security`, `/admin/team`.
- `index.html`, `public/sitemap.xml`, `public/robots.txt` — real placeholder domain, no Lovable references.
- `src/pages/Index.tsx` — removed the fabricated Testimonials section (see finding #4b).
- `src/pages/AdminAnalytics.tsx` — rewritten, real data.
- `src/pages/AdminReports.tsx` — rewritten, real CSV export.
- `src/pages/AdminSettings.tsx` — rewritten, trimmed to real functionality.
- `src/pages/AdminProfile.tsx` — rewritten, trimmed to real functionality.
- `src/pages/AdminSecurity.tsx`, `src/pages/AdminTeam.tsx` — **deleted**.
- `src/components/admin/AdminSidebar.tsx` — real badge counts (pending gadgets, open tickets), fake "Recent" removed, rebranded to Triple G Admin.
- `src/pages/DashboardSettings.tsx` — rewritten, real password change + account deletion.
- `src/pages/Login.tsx`, `src/pages/Register.tsx` — forgot-password link, Terms/Privacy links.
- `src/components/Footer.tsx`, `src/components/StatsSection.tsx` — real stats via `get_public_stats()` + real newsletter capture.
- `vite.config.ts` — manual chunk splitting for vendor/charting/animation libraries.

## Verification

- [x] `pnpm exec tsc --noEmit` — clean
- [x] `pnpm lint` — clean (9 pre-existing warnings, unrelated to this pass; 0 errors)
- [x] `pnpm build` — succeeds; largest chunk dropped from one ~1.6 MB bundle to a 532 KB main chunk plus separately-cacheable vendor chunks (react, supabase, charts, motion, radix ui)
- [x] Live CDP click-through of every changed route: all public pages (`/`, `/login`, `/register`,
      `/forgot-password`, `/privacy`, `/terms`) load with zero console errors; unauthenticated
      `/admin/*` correctly redirects to `/login`; logged in as the seeded admin, all five rewritten
      admin pages (`/admin`, `/admin/analytics`, `/admin/reports`, `/admin/settings`,
      `/admin/profile`) render real data with zero console errors, including the sidebar's live
      pending-gadget badge; logged in as the seeded user, `/dashboard/settings` renders the real
      password-change form with zero console errors; the landing page's impact stats and footer
      newsletter strip were confirmed rendering real, non-zero numbers from `get_public_stats()`
      (2 gadgets recycled, 43kg CO₂ saved, 2 active users, 7,750 points distributed against the
      seed data) once scrolled into view.

## Recommended order for what's left (P2 #15/#15b, all of P3)

1. Send me your real social links and About/team content (or say "genericize it") — 5 minutes, your call, unblocks #15 and #15b immediately.
2. Trade-in flow UI (#16) — biggest real feature gap, own session.
3. CI + production deploy target (#21) — needed before "live" is meaningful.
4. Payments + email delivery (#17, #18) — needed before those promises are real to users.
5. Full route-level code-splitting (#19) — pure performance polish, do last.
