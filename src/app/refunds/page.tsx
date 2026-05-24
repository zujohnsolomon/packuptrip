import Link from "next/link";
import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "Refunds & Cancellation · Packuptrip",
  description:
    "Packuptrip's refund and cancellation policy for travellers and hosts — what you get back and when.",
};

export default function RefundsPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Refunds & Cancellation"
      subtitle="Last updated: May 2026"
      notice={
        <>
          <strong>Draft — pending legal review.</strong> This document has not
          yet been reviewed by a lawyer. It is published in good faith as a
          working draft and will be updated before or shortly after launch.
        </>
      }
    >
      <p>
        This policy applies to all bookings on Packuptrip — both Packuptrip
        Originals and Community Trips. Please read it before booking.
      </p>

      <h2>1. The 8% service fee</h2>
      <p>
        The 8% service fee charged at booking is <strong>non-refundable</strong>{" "}
        in all circumstances once a booking is confirmed. It covers payment
        processing, platform infrastructure, customer support, and listing
        review — costs we incur regardless of whether a trip runs.
      </p>

      <h2>2. Traveller cancellations</h2>
      <p>
        If you cancel a booking you made as a joiner or traveller, the refund
        depends on how far in advance you cancel:
      </p>
      <ul>
        <li>
          <strong>More than 30 days before the trip start date:</strong> full
          refund of the trip price paid (excluding the service fee).
        </li>
        <li>
          <strong>15–30 days before the trip start date:</strong> 50% refund of
          the trip price paid (excluding the service fee).
        </li>
        <li>
          <strong>Less than 15 days before the trip start date:</strong> no
          refund of the trip price. The service fee is also non-refundable.
        </li>
      </ul>
      <div className="callout">
        The 20% deposit paid at booking is included in these calculations — it
        is not a separate non-refundable charge. If you cancel more than 30
        days out, you get it back along with the rest of the trip price.
      </div>

      <h2>3. Host cancellations</h2>
      <p>
        If a host cancels a Community Trip before it starts, joiners receive a{" "}
        <strong>full refund of the trip price</strong>, including their deposit.
        The service fee is also refunded in this case, as the trip did not run.
      </p>
      <p>
        Hosts who cancel trips repeatedly — or within 7 days of the start date
        without a serious, documented reason — may be suspended from the
        platform.
      </p>

      <h2>4. Packuptrip Originals cancellations</h2>
      <p>
        If Packuptrip cancels an Original for any reason — insufficient
        bookings, operational issues, force majeure — you will receive a full
        refund of everything paid, including the service fee.
      </p>
      <p>
        We will notify you as early as possible and, where feasible, offer
        alternative dates before processing a refund.
      </p>

      <h2>5. No-shows and partial trips</h2>
      <p>
        If you miss the trip departure or leave partway through, no refund is
        issued for the unused portion. Travel insurance is your best protection
        against unexpected circumstances — we strongly recommend it.
      </p>

      <h2>6. Trip materially different from listing</h2>
      <p>
        If a Community Trip is significantly different from what was listed —
        different location, missing inclusions, or a safety concern — you should
        raise a report via the <Link href="/report">report form</Link>{" "}
        immediately. We will investigate and, if the discrepancy is
        substantiated, may issue a partial or full refund at our discretion.
        These cases are reviewed individually.
      </p>

      <h2>7. How refunds are processed</h2>
      <p>
        Refunds are returned to the original payment method. Processing time
        depends on your bank or card provider but is typically 5–10 business
        days after we initiate the refund.
      </p>
      <p>
        To request a refund or ask about a specific booking, email{" "}
        <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a> with
        your booking reference. Payment disputes are treated as high priority.
      </p>

      <h2>8. Disputes</h2>
      <p>
        If you believe a refund has been incorrectly applied, or if you have a
        dispute with a host over a refund, contact us and we will mediate. Our
        decision in refund disputes is final, subject to any rights you have
        under applicable Indian consumer protection law.
      </p>

      <hr />

      <p>
        Refund questions? Write to{" "}
        <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a> or visit
        the <Link href="/contact">contact page</Link>.
      </p>
    </ProsePage>
  );
}
