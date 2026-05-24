import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "Contact · Packuptrip",
  description:
    "Get in touch with the Packuptrip team — questions, feedback, partnership ideas, or a safety concern.",
};

export default function ContactPage() {
  return (
    <ProsePage
      eyebrow="Get in touch"
      title="Contact us"
      subtitle="We're a small team and we read every message. Expect a reply within one business day."
    >
      <h2>Email us</h2>
      <p>
        For most things — booking questions, host support, feedback, or just a
        hello — email is the fastest route to a real answer:
      </p>
      <div className="callout">
        <strong>hello@packuptrip.com</strong>
        <br />
        We aim to reply within one business day. Safety and payment issues are
        flagged as high priority and read the same day.
      </div>

      <h2>What to write about</h2>
      <ul>
        <li>
          <strong>Booking help</strong> — payment questions, confirmation
          issues, or changes to an upcoming trip.
        </li>
        <li>
          <strong>Host support</strong> — listing questions, payout queries, or
          help with your host dashboard.
        </li>
        <li>
          <strong>Safety or fraud concern</strong> — if something felt wrong
          during or after a trip. These are read the same day.
        </li>
        <li>
          <strong>Partnership or press</strong> — B2B travel supply, media
          enquiries, or collaboration ideas.
        </li>
        <li>
          <strong>General feedback</strong> — something you liked, something
          that should be better, a feature you wish existed.
        </li>
      </ul>

      <h2>Report a problem</h2>
      <p>
        If you need to flag a specific listing, user, or incident — use the
        dedicated <a href="/report">report form</a>. It routes directly to our
        safety queue and gets a faster response than a general email.
      </p>

      <h2>Response times</h2>
      <ul>
        <li>Safety and payment issues — same day</li>
        <li>Booking and host queries — within one business day</li>
        <li>General feedback and partnerships — within two to three business days</li>
      </ul>

      <hr />

      <p>
        <strong>Made with care in India.</strong> Packuptrip is a small team
        building the warmest place to plan and share travel in India. When you
        write to us, a person reads it.
      </p>
    </ProsePage>
  );
}
