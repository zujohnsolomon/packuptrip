# Packuptrip — Long-term roadmap

This is the **north star**. It is NOT the active build order. For what to build
right now, see [`SKILL.md` § 7 Build Order](./SKILL.md). Sequence below is
strict — **do not start a later phase until the previous one ships**.

The founder's note (verbatim, because it's load-bearing):

> Be as ambitious as you want with the vision — but ruthlessly boring with the
> launch. Ship the core, get real travellers, let them tell you which of these
> features to build next.

---

## Phase 0 — LAUNCH CORE (in progress)

The boring, revenue-bearing core. Do not skip, do not optimise around. Tracked
in the project task list and `SKILL.md § 7`.

- Functional search + filters
- Polished detail/booking page
- User accounts + "my bookings"
- Host onboarding flow
- Two-way reviews
- Payments (Razorpay Route or Cashfree Easy Split)

A working checkout earns money. An AI concierge with a broken checkout earns ₹0.

## Phase 1 — FAST FOLLOW (cheap wow, drives retention)

Build immediately after launch core, before anything in later phases.

- **Per-trip group chat** — auto-join when you book. The chat is the community.
- **Traveller passport** — gamified profile: trip stamps, km travelled, states
  visited. People chase stamps.
- **Post-trip shared memory page** — auto-generated: group photos, route on
  a map, "you travelled X km together." Free marketing.
- **Two-sided referral credits** — both sides get travel credit. Travel
  referrals spread fast.

## Phase 2 — THE MOAT

Features that make Packuptrip genuinely different. Built once Phase 1 retention
is proven.

- **Trip DNA matching** — short signup quiz (pace, budget, social style, sleep
  schedule). Community trips show a "82% your vibe" score. Attacks the #1 fear
  of stranger-travel: "what if I don't click with these people?"
- **AI trip concierge** — chat assistant answers "₹20k, 5 days in October,
  somewhere green" and surfaces real packages + trips.
- **AI itinerary draft for hosts** — host types "Spiti, 7 days, mid-budget"
  and gets a starting itinerary to edit. Removes the blank-page problem.
- **Smart trip descriptions** — host uploads photos + bullets; AI writes the
  warm, on-brand description.
- **Review summariser** — "Travellers love the host's flexibility; some mention
  long drive days." Synthesised from real reviews.
- **Verification tiers** — ID → phone → social → Superhost. Visible badges.
  Trust becomes status people earn.
- **Packuptrip Plus** — paid membership: zero service fees, early access to
  trips, priority support.

## Phase 3 — SCALE

Revenue beyond commission. Only after Phase 2 product-market fit is real.

- **B2B white-label storefronts** — agencies run their storefront on our tech.
- **Add-ons marketplace** — insurance, airport transfers, gear rental,
  activities. Affiliate or commission.
- **Host leaderboards + Superhost perks** — featured placement, lower
  commission, early feature access.
- **Gift cards** — travel gifting is an untapped market.
- **Sponsored trips** — brands sponsor themed community trips.

---

## Trust & safety — runs in parallel with every phase

Treat as a feature, not a footnote. Some items belong to Phase 2 (verification
tiers, Superhost), others should be live earlier:

- **Two-way ratings with teeth** — low-rated hosts get coaching, then delisted.
- **In-app-only contact** until a booking is confirmed.
- **SOS / live location share** during a trip — share location with a chosen
  contact, one-tap trouble flag.
- **Women-only trips** — verified filter. Big unlock for the Indian market.

## Honest constraints (do not forget)

- Building ≠ running. A solo founder with 30 features has 30 half-working
  things.
- The "simple things" being skipped *are* the revenue. Search, filters, the
  booking page, accounts, payments — boring, yes. **That is the business.**
- The scarce resource is **focus**, not tokens. Risk is shipping a bloated
  product six months late, not API cost.

## How to apply this file

When a feature request comes in:

1. Find which phase it belongs to.
2. If the previous phase isn't shipped, **say so and defer it**. Don't quietly
   start building.
3. If it doesn't fit any phase, flag it for a real business decision from the
   founder — don't invent the answer.
