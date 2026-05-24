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

**Build order (decided 22 May 2026):** Epics 1–4 done. Next: **5 → 9 → 6 → 7**.
Bookings first to generate real data, then admin so the founder can operate
the platform, then host flow so submissions flow through the admin approval
queue, then payments last (needs registered business). Reviews + messaging +
ID verification (Epic 8) is sequenced after Epic 7.

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

### Epic 5 — Booking / join flow ⏳

- [ ] `/book/package/[id]` and `/book/trip/[id]` checkout pages
- [ ] Review + confirm UI: price breakdown (base + 7% service fee), traveller count, contact
- [ ] Booking submit creates a `bookings` row with status `requested`, decrements `spots_left`
- [ ] Confirmation page with booking reference
- [ ] "My bookings" panel on `/account` reads real bookings
- [ ] No live payment — Razorpay/Cashfree wiring deferred to Epic 7

### Epic 6 — Host flow 🚧

- [ ] **T6.1** — Post a trip. `/host` landing (what hosting is, expectations, commission) + `/host/new` create form (basics, description, images, includes, tags, itinerary, pricing, spots). Saves as `draft`; submit flips to `pending` (lands in T9.3 approval queue). Anyone signed in can host for v1; admin can revoke via T9.6.
- [ ] **T6.2** — Host dashboard. `/host/trips` list of host's own trips grouped by status (draft / pending / live / completed / cancelled). Edit drafts, view admin notes / rejection reasons, resubmit after changes.
- [ ] **T6.3** — Manage join requests. Host opens a trip → sees the list of travellers who booked, contact info, ability to cancel a join request, basic stats. (Real messaging comes in Epic 8.)
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

### Epic 9 — Admin Dashboard

Build **after Epic 4 (auth)**, **before launch**. Role-gated at `role = 'admin'`
on the `profiles` table. The admin role + RLS hooks for it are already in the
schema; this epic builds the UI.

**Launch slice** (must ship before public launch):

- [ ] **T9.1** — Role-protected `/admin` area, accessible only to users with `role = 'admin'`. Sidebar layout.
- [ ] **T9.2** — Admin Overview page: key metrics (bookings, revenue, active trips), revenue split Originals vs Community, recent activity feed, a "needs attention" panel (pending approvals, reports, payouts).
- [ ] **T9.3** — Trip Review & Approval queue: list pending host trips, full preview, approve / reject with reason / request changes / edit before approving.
- [ ] **T9.4** — Manage Originals: create, edit, delete, publish/unpublish packages; see bookings per package.
- [ ] **T9.6** — Users admin: searchable user list, view profiles + booking history, ID verification approval queue, suspend/ban, change roles.
- [ ] **T9.8** — Bookings admin: all bookings, filter by status / trip / user / date, manual cancel/refund.
- [ ] **T9.9** — Reports & Safety: user-submitted reports and incident log, status tracking (open / investigating / resolved). Must be prominent.

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
- [ ] **Resolve GitHub push credentials** so Vercel switches from CLI deploys to git-triggered deploys on push to `main`.
- [ ] **Set Site URL + redirect allowlist** in Supabase Auth → URL Configuration to include the production Vercel domain (and any custom domains).
- [ ] **Custom domain.** Point packuptrip.com (and/or .in) at Vercel; update Site URL accordingly.
- [ ] **Remove T9.3 seed test data.** Two pending Community Trips were inserted to make the approval queue testable. They're tagged with `__seed_test_data`. Before launch: `delete from public.trips where '__seed_test_data' = any(tags);`

---

## DEFERRED (post-launch only — see roadmap.md for full phasing)

- Phase 1 (fast follow): per-trip group chat, traveller passport, post-trip memory page, referral credits
- Phase 2 (moat): Trip DNA matching, AI concierge, AI itinerary draft, verification tiers + Superhost, Packuptrip Plus membership
- Phase 3 (scale): B2B white-label, add-ons marketplace, host leaderboards, gift cards, sponsored trips

**Do not start any of the above until the launch core (Epics 1–9) is shipped
and real travellers are using it.** See `roadmap.md` for the founder's note
on discipline.
