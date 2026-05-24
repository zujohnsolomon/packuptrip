import Link from "next/link";
import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "Trust & Safety · Packuptrip",
  description:
    "How Packuptrip keeps travellers and hosts safe — listing reviews, secure payments, reports, and what to do if something goes wrong.",
};

export default function TrustPage() {
  return (
    <ProsePage
      eyebrow="Trust & Safety"
      title="How we keep you safe"
      subtitle="Every booking on Packuptrip is backed by screening, secure payments, and a team that takes safety seriously."
    >
      <h2>Listing review before every trip goes live</h2>
      <p>
        Every community trip submitted by a host is reviewed by the Packuptrip
        team within <strong>24 hours</strong> before it appears in browse or
        search. We check that the itinerary is real and detailed, the price is
        reasonable, photos match the destination, and no red flags exist in the
        host's account history.
      </p>
      <p>
        Listings that are vague, misleading, or priced in a way that doesn't
        add up are rejected. The host is told why and can revise and
        resubmit. This is a manual step — a person reads every listing, not just
        an algorithm.
      </p>
      <div className="callout">
        <strong>Packuptrip Originals</strong> are trips we operate ourselves.
        They go through the same bar on quality and honesty, and we're
        accountable for every aspect of the experience end to end.
      </div>

      <h2>Payments held until the trip starts</h2>
      <p>
        When you book a trip, your payment is held by our payment partner — not
        released to the host until the trip has actually started. This means:
      </p>
      <ul>
        <li>Hosts cannot cash out early and disappear.</li>
        <li>If a trip is cancelled before it starts, your refund path is clear.</li>
        <li>
          The 20% deposit you pay at booking is held the same way — it is never
          accessible to the host before departure.
        </li>
      </ul>
      <p>
        We use a regulated marketplace split-payment provider to handle these
        flows. Packuptrip itself does not hold your money in a company bank
        account.
      </p>

      <h2>Service fee and what it covers</h2>
      <p>
        Joiners pay an <strong>8% service fee</strong> on top of the trip price.
        This fee funds our payment processing, customer support, listing review,
        and the trust infrastructure described on this page. It is shown clearly
        in the price breakdown before you confirm a booking — there are no
        hidden charges.
      </p>

      <h2>Reviews — two ways</h2>
      <p>
        After every completed trip, both travellers and hosts can leave reviews.
        A joiner reviews the host and experience; the host can review their
        joiners. Reviews are public and tied to verified bookings — you cannot
        leave a review for a trip you didn't actually join.
      </p>
      <p>
        Ratings feed into host reputation scores that are visible on every
        listing. Hosts with repeated poor reviews are removed from the platform.
      </p>

      <h2>Reporting a problem</h2>
      <p>
        If something is wrong — a listing you believe is fraudulent, behaviour
        that made you feel unsafe, a host who didn't show up — you can report
        it directly from your booking page or use the{" "}
        <Link href="/report">report a problem</Link> form. Every report is
        reviewed by a person within 24 hours.
      </p>
      <p>
        Reports we act on immediately include: suspected fraud, safety incidents
        during a trip, and payment disputes where a host has not delivered what
        was promised. For urgent safety situations, please also contact local
        emergency services — we are a platform, not a first responder.
      </p>

      <h2>What we ask of hosts</h2>
      <ul>
        <li>Post only trips you genuinely intend to run.</li>
        <li>Describe the experience accurately — no inflated claims.</li>
        <li>
          Communicate promptly with joiners once a booking is confirmed.
        </li>
        <li>
          Let us know as early as possible if a trip needs to be cancelled so
          joiners have time to make other plans.
        </li>
      </ul>
      <p>
        Hosts who repeatedly violate these standards — through cancellations,
        misleading listings, or conduct reports — are suspended or permanently
        removed. We take host accountability seriously because every bad
        experience hurts the entire community.
      </p>

      <h2>What we ask of travellers</h2>
      <ul>
        <li>
          Book only when you genuinely intend to join — last-minute cancellations
          affect other joiners and the host.
        </li>
        <li>
          Be respectful of hosts, other travellers, and the places you visit.
        </li>
        <li>Leave honest reviews — both good and critical feedback helps.</li>
      </ul>

      <h2>ID verification</h2>
      <p>
        ID verification for hosts is on our near-term roadmap. Until it is
        live, we rely on manual listing review, payment holds, and our report
        system as the primary trust layer. We'll announce when verification
        launches.
      </p>

      <hr />

      <h2>Questions or concerns?</h2>
      <p>
        If you have a safety concern or question that isn't covered here, reach
        us at <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a> or
        via the <Link href="/contact">contact page</Link>. Safety messages are
        flagged as high priority and read the same day.
      </p>
    </ProsePage>
  );
}
