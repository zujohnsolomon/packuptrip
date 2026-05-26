# Packuptrip — Tasks

> Operational build plan. The strategic build order lives in
> [`.claude/skills/packuptrip/SKILL.md`](./.claude/skills/packuptrip/SKILL.md)
> §7; this file is the working task breakdown. Long-term feature vision
> lives in [`.claude/skills/packuptrip/roadmap.md`](./.claude/skills/packuptrip/roadmap.md).
>
> **Status legend:** ✅ done · 🚧 in progress · ⏳ planned · ⏸ deferred (out of launch)

---

## LAUNCH CORE

Everything below ships before public launch. No work from `roadmap.md`
phases 1+ begins until launch is done.

**Build order (decided 22 May 2026):** Epics 1–5 done. Epic 9 (admin launch slice) done.
Epic 6 done (T6.1 ✅ T6.2 ✅ T6.3 ✅). Next: **Epic 7 (Payments)**.
Host flow complete; payments last (needs registered business).
Reviews + messaging + ID verification (Epic 8) is sequenced after Epic 7.

**Locked business numbers (23 May 2026):**
- Traveller service fee: **8%**
- Host commission (Community Trips): **12%** (applied in Epic 7)
- Booking deposit: **20% upfront**, balance before trip start (Epic 7)

These live in [`src/lib/pricing.ts`](./src/lib/pricing.ts) — single source of
truth. The booking RPC carries its own copy of the service fee for atomic
calculation; changing one requires a migration that updates both.
**Until T9.12 ships post-launch, these are NOT editable via the admin UI.**

### Epic 1 — Foundation ✅

- [x] Next.js 16 + TS + Tailwind v4 + pnpm scaffold
- [x] Design system: warm cream, amber (single brand), teal for Community accents
- [x] Header / Footer / Badge / Logo primitives
- [x] Image config + Fraunces + Inter fonts
- [x] Vercel deploy pipeline (CLI for now; switch to git-triggered once GitHub auth resolves)
- [x] Supabase MCP wired (`.mcp.json`)

### Epic 2 — Data models + database schema ✅

- [x] TypeScript types in `src/types/db.ts`
- [x] Postgres schema in `supabase/schema.sql`: profiles, packages, trips, bookings, reviews, message_threads, messages
- [x] Row-level security on every table
- [x] `handle_new_user()` trigger auto-creates a profile on signup
- [x] Migrations applied via Supabase MCP
- [x] Security advisors clean

### Epic 3 — Browse + detail + search ✅

- [x] Home page (premium photo + headline + search + trending strip)
- [x] `/packages` and `/trips` browse pages with filters (q, from, to, max price)
- [x] `/search` unified results across Originals and Community Trips
- [x] `/packages/[id]` and `/trips/[id]` detail pages (hero, itinerary, inclusions, price card, host card on trips)
- [x] Branded custom date picker (react-day-picker, amber theme) across hero and FilterBar

### Epic 4 — Auth + accounts ✅

- [x] Supabase Auth (email/password) via `@supabase/ssr`
- [x] `/signup`, `/login`, `/auth/callback`, `/auth/logout`
- [x] Session-refresh edge proxy (`src/proxy.ts`)
- [x] Auth-aware Header (subscribes to `onAuthStateChange`)
- [x] `/account` protected page with placeholder bookings/hosted panels
- [ ] Custom Supabase SMTP via Resend (still on default mailer — rate-limited)

### Epic 5 — Booking / join flow ✅

- [x] `/book/package/[id]` and `/book/trip/[id]` checkout pages
- [x] Review + confirm UI: price breakdown (base + 8% service fee), traveller count, contact
- [x] Booking submit creates a `bookings` row with status `requested`, decrements `spots_left`
- [x] Confirmation page with booking reference (`/bookings/[id]`)
- [x] "My bookings" panel on `/account` reads real bookings
- [x] No live payment — Razorpay/Cashfree wiring deferred to Epic 7

### Epic 6 — Host flow 🚧

- [x] **T6.1** — Post a trip. `/host` landing (what hosting is, expectations, commission) + `/host/new` create form (basics, description, images, includes, tags, itinerary, pricing, spots). Saves as `draft`; submit flips to `pending` (lands in T9.3 approval queue). Anyone signed in can host for v1; admin can revoke via T9.6.
- [x] **T6.2** — Host dashboard. `/host/trips` list of host's own trips grouped by status (draft / pending / live / completed / cancelled). Edit drafts, view admin notes / rejection reasons, resubmit after changes. (`/host/trips/[id]` detail + edit + `HostTripActions` — cancel, resubmit.)
- [x] **T6.3** — Manage join requests. `/host/trips/[id]/joiners` — joiner list with name/email/status/amount, stats strip (total/requested/confirmed/spots left), cancel-join flow (host_cancel_booking RPC atomically cancels + restores spot). BookingsTease card on trip detail now links here. (Real messaging comes in Epic 8.)
- [ ] *(Deferred)* Host application gate — anyone can host or only verified? Default for launch: anyone can host but trips don't go live without admin approval.

### Epic 7 — Payments (Razorpay Route / Cashfree Easy Split) ⏳

- [ ] Choose provider (Razorpay Route preferred per SKILL.md §3)
- [ ] Marketplace account setup (needs registered business + GST)
- [ ] Webhook handler for payment events
- [ ] Hold-until-trip-start logic via provider's escrow
- [ ] Refund + cancellation paths
- [ ] T9.10 admin slice builds alongside this
- [ ] **Split the admin Overview revenue metric** into **Reserved** (`bookings.status = 'requested'`), **Captured** (`status = 'confirmed'`), and **Refunded** (`status = 'refunded'`). Right now Gross Revenue includes unpaid bookings — once real payments land, this is misleading. Replace the single "Gross revenue" KPI with three.

### Epic 8 — Reviews + messaging + ID verification ⏳

- [ ] Two-way reviews after a completed booking (host ↔ traveller)
- [ ] Review aggregation feeds `packages.rating_avg`, `packages.review_count` (and equivalent for trips)
- [ ] In-app messaging: thread per booking pair, message list, send form
- [ ] ID verification flow: upload, manual approval queue in admin (T9.6)

### Epic 9 — Admin Dashboard ✅ (launch slice)

Built after Epic 4 (auth). Role-gated at `role = 'admin'` on the `profiles`
table. The admin role + RLS hooks for it are already in the schema.

**Launch slice** (must ship before public launch):

- [x] **T9.1** — Role-protected `/admin` area, accessible only to users with `role = 'admin'`. Sidebar layout (`/admin/layout.tsx`).
- [x] **T9.2** — Admin Overview page: key metrics (bookings, revenue, active trips), revenue split Originals vs Community, recent activity feed, a "needs attention" panel (pending approvals, reports, payouts).
- [x] **T9.3** — Trip Review & Approval queue: list pending host trips, full preview, approve / reject with reason / request changes / edit before approving. (`/admin/approvals/[id]/edit` for pre-approve edits.)
- [x] **T9.4** — Manage Originals: create, edit, delete, publish/unpublish packages; see bookings per package. (`PackageEditor` component.)
- [x] **T9.6** — Users admin: searchable user list, view profiles + booking history, ID verification approval queue, suspend/ban, change roles.
- [x] **T9.8** — Bookings admin: all bookings, filter by status / trip / user / date, manual cancel/refund.
- [x] **T9.9** — Reports & Safety: user-submitted reports and incident log, status tracking (open / investigating / resolved). User-facing `/report` form (+ `/report/sent`) feeds this queue.

**Deferred to post-launch:**

- [ ] ⏸ **T9.5** — Manage Community Trips: view all host trips by status, force-edit or take down a trip. *(For launch, use T9.3 for moderation.)*
- [ ] ⏸ **T9.7** — Host Management: hosts list with ratings and tier, promote tiers, flag/delist low-rated hosts, host application queue. *(For launch, manage via T9.6.)*
- [ ] ⏸ **T9.10** — Payments & Payouts admin: revenue summary, pending host payouts, refunds, transaction log. *(Build alongside Epic 7.)*
- [ ] ⏸ **T9.11** — Reviews moderation: all reviews, flagged-review handling, hide/remove.
- [ ] ⏸ **T9.12** — Platform Settings: configurable service fee %, host commission %, deposit %, minimum group size; manage homepage featured trips; edit static content. *(For launch, these are hard-coded constants in code.)*

---

## PRE-LAUNCH CHECKLIST

Things to do before flipping the site public. Add to as we hit them.

- [ ] **Wire up Resend SMTP** for transactional auth emails and re-enable "Confirm email" in Supabase Auth → Sign In / Providers → Email. Email confirmation is currently OFF for dev testing only — must be ON for launch. Resend setup steps in chat history (May 2026).
- [x] ~~**Lock in the real service fee.**~~ ✅ Locked at **8%** on 23 May 2026. Source: [`src/lib/pricing.ts`](./src/lib/pricing.ts) + booking RPC `v_fee_rate`.
- [ ] **Enable leaked-password protection** in Supabase Dashboard → Auth → Password Protection (currently disabled per security advisor).
- [x] ~~**Resolve GitHub push credentials**~~ ✅ Working — git push to `main` triggers Vercel deploys.
- [ ] **Set Site URL + redirect allowlist** in Supabase Auth → URL Configuration to include the production Vercel domain (and any custom domains).
- [ ] **Custom domain.** Point packuptrip.com (and/or .in) at Vercel; update Site URL accordingly.
- [x] ~~**Remove T9.3 seed test data.**~~ ✅ Done — both seed trips deleted from DB on 26 May 2026.
- [ ] **Add env vars to Vercel dashboard:** `ANTHROPIC_API_KEY` (AI features), `CRON_SECRET` (cron security), `RESEND_API_KEY` (already in Vercel?), `NEXT_PUBLIC_SITE_URL` (update to production domain once custom domain is live).

---

## BUILT AHEAD OF LAUNCH (originally deferred Phase 1 + 2)

These were originally Phase 1/2 post-launch features but were built pre-launch at the founder's direction:

- [x] **Per-trip group chat** — real-time group chat for trip members (`/trips/[id]/chat`)
- [x] **Traveller passport** — public profiles for joiners (`/passport/[userId]`)
- [x] **Post-trip memory page** — crew, itinerary, reviews in one shareable page (`/trips/[id]/memory`)
- [x] **Referral credits (E1)** — invite link → ₹200 credit on friend's first booking (`/invite/[code]`, `/account/referrals`)
- [x] **AI itinerary draft (E2)** — ✨ AI Draft button in host trip creation form (`/api/ai/itinerary`, requires `ANTHROPIC_API_KEY`)
- [x] **Trip DNA matching (F1)** — logged-in users see 🧬 Matched for your vibe strip on `/trips`
- [x] **AI Concierge (F2)** — floating Packy 🧭 chat widget sitewide (`/api/ai/concierge`, requires `ANTHROPIC_API_KEY`)
- [x] **Packuptrip Plus (F3)** — membership tier: 4% fee, double referral credits, Plus badge. Landing page `/plus`, waitlist, admin grant/revoke.
- [x] **Superhost tier** — surfaced on trip and host profile pages; admin can set via `/admin/hosts`

## DEFERRED (post-launch only — see roadmap.md for full phasing)

- Phase 3 (scale): B2B white-label, add-ons marketplace, host leaderboards, gift cards, sponsored trips
- Epic 7 (Payments): blocked on domain registration + GST + Razorpay marketplace account

**Payments (Epic 7) is the only remaining major blocker before real-money transactions.** See `roadmap.md`.
