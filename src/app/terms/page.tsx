import Link from "next/link";
import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "Terms of Service · Packuptrip",
  description:
    "The terms that govern your use of the Packuptrip platform — booking, hosting, and community standards.",
};

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Last updated: May 2026"
      notice={
        <>
          <strong>Draft — pending legal review.</strong> This document has not
          yet been reviewed by a lawyer. It is published in good faith as a
          working draft and will be updated before or shortly after launch.
        </>
      }
    >
      <h2>1. Who we are and what this covers</h2>
      <p>
        Packuptrip ("we", "us", "our") operates the Packuptrip platform,
        accessible at packuptrip.com and packuptrip.in. These Terms of Service
        ("Terms") govern your access to and use of the platform, including
        browsing, booking trips, hosting trips, and any other interactions with
        Packuptrip services.
      </p>
      <p>
        By creating an account or using the platform, you agree to these Terms.
        If you do not agree, please do not use the platform.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account or make a
        booking. By using the platform, you confirm that you meet this
        requirement. We reserve the right to request age verification at any
        time.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You are responsible for maintaining the security of your account
        credentials. Do not share your login details. You are accountable for
        all activity that occurs under your account.
      </p>
      <p>
        We may suspend or terminate accounts that violate these Terms, engage
        in fraudulent activity, or cause harm to other users.
      </p>

      <h2>4. The two types of trips</h2>
      <p>
        <strong>Packuptrip Originals</strong> are trips planned, operated, and
        delivered by Packuptrip. When you book an Original, your contract is
        with Packuptrip directly.
      </p>
      <p>
        <strong>Community Trips</strong> are trips posted by independent hosts
        — verified users who have agreed to hosting standards. When you join a
        Community Trip, your contract for the experience is with the host.
        Packuptrip facilitates the booking, payment, and dispute process, but
        is not the operator of the trip.
      </p>

      <h2>5. Booking and payments</h2>
      <p>
        Booking a trip on Packuptrip constitutes an offer to purchase or join
        that trip at the listed price. Bookings are confirmed once payment is
        processed. The following charges apply:
      </p>
      <ul>
        <li>
          <strong>Deposit:</strong> 20% of the total trip price is collected at
          the time of booking.
        </li>
        <li>
          <strong>Service fee:</strong> An 8% service fee is added to the trip
          price for all bookings. This fee is non-refundable once a booking is
          confirmed, except where stated in our{" "}
          <Link href="/refunds">Refunds &amp; Cancellation policy</Link>.
        </li>
        <li>
          <strong>Balance:</strong> The remaining amount (after the deposit) is
          due before the trip start date. We will notify you of the due date at
          booking.
        </li>
      </ul>
      <p>
        Payments are processed by a third-party payment partner and held until
        the trip starts. Packuptrip does not hold your funds directly.
      </p>

      <h2>6. Host responsibilities</h2>
      <p>
        If you post a Community Trip as a host, you agree to:
      </p>
      <ul>
        <li>Provide accurate and honest descriptions of the trip.</li>
        <li>
          Run the trip as described, or notify joiners promptly if changes are
          necessary.
        </li>
        <li>
          Communicate with joiners in a timely and respectful manner.
        </li>
        <li>
          Accept that Packuptrip may review, withhold, or refund payments to
          joiners if the trip is cancelled, materially misrepresented, or
          results in a substantiated complaint.
        </li>
      </ul>
      <p>
        Hosts earn their per-share price minus a <strong>12% platform
        commission</strong>, which is deducted from the payout after the trip
        starts.
      </p>

      <h2>7. Listing review</h2>
      <p>
        Every Community Trip listing is reviewed by Packuptrip before it goes
        live. We may reject or remove listings that are incomplete, misleading,
        unsafe, or in violation of these Terms. Rejection is not grounds for
        compensation.
      </p>

      <h2>8. Cancellations</h2>
      <p>
        Cancellation terms depend on when the cancellation occurs and who
        initiates it. Full details are in the{" "}
        <Link href="/refunds">Refunds &amp; Cancellation policy</Link>. Please
        read it before booking.
      </p>

      <h2>9. Conduct standards</h2>
      <p>
        All users — travellers and hosts — must interact with each other and
        with Packuptrip staff in good faith. Behaviour that is fraudulent,
        abusive, harassing, or illegal will result in immediate account
        suspension and may be reported to relevant authorities.
      </p>
      <p>
        Packuptrip operates a{" "}
        <Link href="/report">report system</Link> for flagging safety concerns,
        fraudulent listings, and conduct violations.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        Content you post on Packuptrip — trip descriptions, photos, reviews —
        remains yours. By posting, you grant Packuptrip a non-exclusive,
        royalty-free licence to display and promote that content on the
        platform and in marketing materials. You confirm that you have the
        right to share any content you post.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        Packuptrip is a marketplace platform. For Community Trips, we are not
        the operator, guide, or organiser of the trip itself. We are not liable
        for incidents, injuries, or losses that occur during a trip beyond our
        direct control. We strongly recommend that all travellers carry
        adequate travel insurance.
      </p>
      <p>
        To the extent permitted by applicable law, our total liability for any
        claim arising from use of the platform is limited to the amount you
        paid to Packuptrip for the booking in question.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Disputes will be subject
        to the exclusive jurisdiction of courts in India.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        communicated via email or a notice on the platform. Continued use of
        the platform after such notice constitutes acceptance of the updated
        Terms.
      </p>

      <hr />

      <p>
        Questions about these Terms? Write to us at{" "}
        <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a>.
      </p>
    </ProsePage>
  );
}
