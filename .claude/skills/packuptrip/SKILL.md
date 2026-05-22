---
name: packuptrip-project
description: Use when working on the Packuptrip travel platform. Provides the full project context — concept, business model, payment approach, tech stack, v1 scope, design system, data models, and build roadmap. Load this before scaffolding, designing, or implementing any Packuptrip feature.
---

# Packuptrip — Project Skill

This skill carries the full context for building **Packuptrip**, a travel booking platform. Refer to it before making product, design, or architecture decisions so the build stays consistent with what's already been decided.

## 1. The Concept

Packuptrip is a travel platform with **two engines** that feed each other:

- **Packuptrip Originals** — curated tour packages owned and operated by Packuptrip. Fixed dates, fixed itineraries, local guides. Sold directly. Higher margin.
- **Community Trips** — trips posted by everyday users ("hosts"). Other travellers join and split costs. Marketplace model. Lower margin, but drives traffic, trust, and content.

The founder also operates some trips personally, in addition to enabling third-party hosts. Both trip types must be **visually distinct** in the UI so travellers always know who they're buying from.

One-line pitch: *"Find your trip, or find your people — book a curated package or join a fellow traveller's journey."*

Domains secured: `packuptrip.com` and `packuptrip.in`.

## 2. Business Model

**Revenue:**
- Community Trips: traveller service fee (~5–10%, prototype uses 7%) + host commission (~8–12%).
- Originals: direct margin on packages (~20–35%), negotiated wholesale with vendors.

**Strategic notes:**
- Community Trips are best treated as an **acquisition / brand engine**, not the main profit center — travel is low-frequency, so marketplace margins are thin.
- Originals are the **revenue backbone** at launch.
- The founder already has real B2B supply contacts, so the cold-start supply problem is largely solved — building a full platform is justified.

## 3. Payments — Important Constraint

- **Do NOT build custom escrow.** Holding other users' money in a company account triggers RBI regulation in India.
- Use a marketplace split-payment provider: **Razorpay Route** or **Cashfree Easy Split**. The provider handles the regulated escrow/hold/split.
- Funds are held and released to the host only **after the trip starts**.
- Account for ~2–3% gateway fees in margin calculations.
- Originals payments are simple direct sales.
- Implement payments **last** — they need a registered business and real API keys.

## 4. Legal / Compliance (flag, don't skip)

- Selling tour packages = operating as a tour operator: GST registration, possibly state tourism registration.
- Liability for incidents on community trips must be handled by a proper lawyer-drafted Terms of Service — not a template.
- Recommend travel insurance integration later.

## 5. v1 Scope

**Build for v1 (the core loop):**
- Browse packages + community trips, with filters (destination, date, price)
- Detail pages — itinerary, photos, inclusions, price breakdown, spots left
- Book / Join flow with checkout
- Split-payment integration
- User accounts — signup, login, "my bookings"
- Host flow — post a trip, manage it
- Two-way reviews (host ↔ traveller)
- Basic trust: ID verification, in-app messaging

**Defer (do NOT build in v1):**
- Native mobile app (web responsive only)
- Featured / paid listings
- Membership tier ("Packuptrip Plus")
- Insurance, add-ons, gear rental
- Wishlist, social feed, referral system

## 6. Recommended Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS
- **Database:** Postgres via Supabase (also gives auth + storage)
- **Auth:** Supabase Auth or Clerk
- **Payments:** Razorpay Route / Cashfree Easy Split
- **Hosting:** Vercel
- **Images:** Supabase Storage or Cloudinary

## 7. Build Order

Work in this sequence — do not build everything at once:

1. Project scaffold (Next.js + Tailwind + folder structure)
2. Data models + database schema
3. Auth (signup / login / sessions)
4. Browse pages (packages + community trips) with filters
5. Detail pages
6. Booking / join flow (without live payment first)
7. Host flow (post + manage a trip)
8. Reviews + in-app messaging
9. ID verification
10. Payments integration (last — needs registered business)

## 8. Data Models (starting point)

**User** — id, name, email, passwordHash, idVerified (bool), role (traveller/host/admin), createdAt

**Package** (Packuptrip Original) — id, title, location, days, price, ratingAvg, reviewCount, images[], spotsTotal, spotsLeft, tags[], description, includes[], itinerary[], status

**Trip** (Community Trip) — id, hostId (→User), title, location, days, pricePerShare, spotsTotal, spotsLeft, tags[], description, includes[], itinerary[], status (draft/pending/live), createdAt

**Booking** — id, userId, itemId, itemType (package/trip), basePrice, serviceFee, total, status (requested/confirmed/cancelled), createdAt

**Review** — id, bookingId, authorId, subjectId, subjectType (user/package/trip), rating, text, createdAt

**Message** — id, threadId, senderId, body, createdAt

## 9. Design System (premium travel brand, warm community tone)

The visual direction is a **premium travel brand** — confident, warm, image-led. Not corporate, not template-y.

### Color
- **Backgrounds:** warm cream `#fffbeb` (page) and soft stone `#fafaf9` (alternating sections). White for cards.
- **Primary brand color: amber** — `#d97706` (default) / `#b45309` (deep). This is the *only* brand color. All primary CTAs, the logo, and brand accents are amber.
- **Community accent: teal** — `#0d9488` / `#0f766e`. Used **only** for Community Trip badges, host avatar chips, and the host CTA banner. Never used for Originals or general UI.
- **Text:** warm stone — `#292524` body, `#57534e` muted.
- **NO multi-color gradients anywhere.** No gradient text, no amber→teal gradients. Solid colors only. (This was an explicit correction — multi-color gradients read as AI-generated.)

### Typography
- Font: Inter, sans-serif.
- Headlines: solid dark stone, bold, generous size. Use `clamp()` for hero headlines (~2.5rem → 4.5rem).

### Cards
- White background, `rounded-2xl`, real soft shadows (`shadow-card` / `shadow-card-hover` tokens in globals.css).
- Subtle lift on hover (`-translate-y-1`).
- **Every package and trip card MUST use a real destination photograph** (Unsplash). Never flat color or gradient placeholders.

### Layout rhythm
- Alternate section backgrounds — white and soft-cream — for depth and visual rhythm.
- Generous vertical padding between sections.
- Max width `7xl` (1280px) for content.

### Hero
- **Full-bleed travel photograph** (~85vh), warm-toned. Mountain road, ridge, or scenic overlook.
- Dark gradient overlay: `linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65))` so white text stays readable.
- Headline: solid white, bold, extra-large.
- A single floating white search bar (rounded-2xl, soft shadow) below the headline — this is the primary action. No competing CTA buttons.
- Trust strip directly below search bar: white text with check icons — "Verified hosts · Secure payments · 2-way reviews".

### Header
- Sits over the hero photo on the home page: **transparent** with white logo + nav.
- On scroll past the hero, becomes **solid cream** with dark logo + nav.
- On non-hero pages, header is cream from the start.

### Trip-type distinction (load-bearing)
- Originals → amber badge ("Packuptrip Original")
- Community Trips → teal badge ("Community trip") + host avatar chip
- Keep this consistent everywhere. Travellers must always know who they're buying from.

### Tone of voice
- Warm, encouraging, human — never corporate.
- "Find your people," "Travel together, never alone."

## 10. Existing Prototype

A complete front-end prototype existed (built as a React artifact). Pages: home, browse packages, browse community trips, detail page with price breakdown, host form, trust & safety page, and auth. Use it as a reference for layouts when needed, but the current Next.js implementation is authoritative — match its design system, not the prototype's.

## 11. Open Questions for the Founder

Resolve these as the build progresses:
- Exact commission split between traveller fee and host commission
- Launch geography and first destinations (use real B2B inventory, not placeholders)
- Whether to own a niche first or launch broad
- Partner's role and equity arrangement (should be formalised early)
