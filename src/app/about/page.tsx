import Link from "next/link";
import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "About · Packuptrip",
  description:
    "We're a small team building the warmest place to plan and share travel in India. Here's what Packuptrip is, why we built it, and what we care about.",
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="Our story"
      title="About Packuptrip"
      subtitle="We're a small team building the warmest place to plan and share travel in India."
    >
      <h2>What is Packuptrip?</h2>
      <p>
        Packuptrip is a travel platform with two sides. On one side, we publish
        <strong> Packuptrip Originals</strong> — trips we've built ourselves,
        end to end, for travellers who want to show up and experience something
        exceptional without the planning overhead. On the other side we have
        <strong> Community trips</strong> — where anyone with a plan can post it,
        invite other travellers to join, and split the cost fairly.
      </p>
      <p>
        Payments, bookings, and trust infrastructure are handled by us, so hosts
        can focus on the trip and joiners can book with confidence.
      </p>

      <h2>Why we built it</h2>
      <p>
        Most travel in India is either fully solo or a rigid group tour where
        the itinerary is locked and the bus leaves at 5 am whether you like it
        or not. The middle ground — small groups of like-minded people, flexible
        plans, cost-sharing that actually makes sense — barely exists as a
        product.
      </p>
      <p>
        We started Packuptrip because we wanted that middle ground to exist. A
        place where a solo traveller headed to Spiti can find three others going
        the same week. Where someone planning a quiet Coorg trip doesn't have to
        spam their entire contact list. Where the person who organised
        everything actually benefits from doing so, instead of just absorbing
        all the coordination stress.
      </p>

      <h2>How community trips work</h2>
      <p>
        Any verified user can post a trip. We review every listing before it
        goes live — checking that the description is honest, the price is fair,
        and the itinerary is real. Once approved, the trip appears in browse and
        search. Travellers request to join; hosts can see who's interested and
        accept or decline. Payments are collected securely and held until the
        trip begins.
      </p>
      <p>
        Hosts earn their per-share price minus a small platform commission.
        Joiners pay a service fee on top of the trip price that covers our
        infrastructure, payment processing, and customer support. Neither side
        pays anything until a booking is confirmed.
      </p>
      <div className="callout">
        Want to host a trip? Read how it works on the{" "}
        <Link href="/host">Host a trip</Link> page, then post your first listing
        in about ten minutes.
      </div>

      <h2>Our values</h2>
      <ul>
        <li>
          <strong>Honest listings only.</strong> We reject vague itineraries,
          misleading photos, and prices that don't add up. If a listing would
          disappoint a reasonable person who read it carefully, it doesn't go
          live.
        </li>
        <li>
          <strong>Money held fairly.</strong> Joiners' payments are held by our
          payment partner until the trip actually starts. No early cash-outs, no
          hosts disappearing with deposits.
        </li>
        <li>
          <strong>Safety taken seriously.</strong> We have a reports and review
          system, ID verification is on our roadmap, and any safety complaint is
          treated as our highest priority. More on this on the{" "}
          <Link href="/trust">Trust &amp; Safety</Link> page.
        </li>
        <li>
          <strong>Small company, real people.</strong> When you email us, a
          person reads it. When something breaks, a person fixes it. We're not
          yet at "team of hundreds" scale, and honestly we think that makes us
          better at this.
        </li>
      </ul>

      <h2>Where we're based</h2>
      <p>
        Packuptrip is built in India, for India — though we love it when trips
        cross borders. Our focus for now is domestic travel: the Himalayas, the
        Western Ghats, the coasts, the deserts. There's more than enough to
        explore before we need to think globally.
      </p>

      <h2>Get in touch</h2>
      <p>
        Questions, feedback, partnership ideas — we're easy to reach. Drop us a
        line on the <Link href="/contact">Contact page</Link> and we'll respond
        within a day or two.
      </p>
    </ProsePage>
  );
}
