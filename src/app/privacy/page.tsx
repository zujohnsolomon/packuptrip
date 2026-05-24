import { ProsePage } from "@/components/layout/ProsePage";

export const metadata = {
  title: "Privacy Policy · Packuptrip",
  description:
    "How Packuptrip collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Last updated: May 2026"
      notice={
        <>
          <strong>Draft — pending legal review.</strong> This document has not
          yet been reviewed by a lawyer. It is published in good faith as a
          working draft and will be updated before or shortly after launch.
        </>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        Packuptrip operates the travel booking platform at packuptrip.com and
        packuptrip.in ("the platform"). This Privacy Policy explains how we
        collect, use, store, and protect personal data when you use our
        platform.
      </p>
      <p>
        By using Packuptrip, you agree to the practices described in this
        policy. If you do not agree, please do not use the platform.
      </p>

      <h2>2. Data we collect</h2>
      <h3>Information you give us</h3>
      <ul>
        <li>
          <strong>Account data:</strong> your name, email address, and password
          when you sign up.
        </li>
        <li>
          <strong>Profile data:</strong> any additional profile details you
          choose to add (photo, bio, preferences).
        </li>
        <li>
          <strong>Booking data:</strong> trip selections, dates, passenger
          details, and payment information processed through our payment
          partner.
        </li>
        <li>
          <strong>Trip listings:</strong> if you are a host, the content,
          photos, itineraries, and pricing you submit.
        </li>
        <li>
          <strong>Communications:</strong> messages you send to other users via
          the platform, and emails you send to us.
        </li>
        <li>
          <strong>Reviews:</strong> ratings and text reviews you submit.
        </li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Usage data:</strong> pages visited, features used, search
          queries, and time spent on the platform.
        </li>
        <li>
          <strong>Device and connection data:</strong> IP address, browser
          type, operating system, and referring URL.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> session cookies
          for authentication, and analytics cookies to understand how the
          platform is used.
        </li>
      </ul>

      <h3>Information from third parties</h3>
      <p>
        If you sign in via a third-party provider (e.g. Google), we receive
        your name and email address from that provider, subject to their
        privacy policy. We receive transaction confirmation data from our
        payment processing partner — we do not store raw card numbers.
      </p>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To create and maintain your account.</li>
        <li>
          To process bookings, collect payments, and facilitate payouts to
          hosts.
        </li>
        <li>
          To display your profile to other users where relevant (e.g. your
          host profile on a listing).
        </li>
        <li>
          To send you booking confirmations, payment receipts, and trip
          reminders.
        </li>
        <li>
          To review trip listings before they go live, and to investigate
          safety reports.
        </li>
        <li>
          To improve the platform through aggregated, anonymised usage
          analysis.
        </li>
        <li>
          To send product updates or marketing communications — you can opt out
          of these at any time.
        </li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>4. Data sharing</h2>
      <p>We share your data only in these limited circumstances:</p>
      <ul>
        <li>
          <strong>With other users:</strong> your profile name and photo are
          visible to hosts when you request to join their trip, and to joiners
          when you host. Message content is shared with the recipient only.
        </li>
        <li>
          <strong>With payment partners:</strong> your payment details are
          handled directly by our payment processing provider under their own
          privacy and security terms.
        </li>
        <li>
          <strong>With service providers:</strong> infrastructure, analytics,
          and email tools that process data on our behalf under data processing
          agreements.
        </li>
        <li>
          <strong>For legal compliance:</strong> if required by law, court
          order, or a legitimate government authority.
        </li>
        <li>
          <strong>In a business transfer:</strong> if Packuptrip is acquired or
          merges with another company, your data may transfer as part of that
          transaction. We will notify you before this happens.
        </li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>

      <h2>5. Data storage and security</h2>
      <p>
        Your data is stored on servers in secure data centres. We use
        industry-standard encryption in transit (HTTPS/TLS) and at rest. Access
        to personal data is restricted to team members who need it to operate
        the platform.
      </p>
      <p>
        No system is completely secure. If we become aware of a data breach
        that affects your personal data, we will notify you as required by
        applicable law.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We retain your account data for as long as your account is active. If
        you delete your account, we remove your personal data within 30 days,
        except where we are required to retain it for legal or financial
        compliance (e.g. transaction records).
      </p>

      <h2>7. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate data.</li>
        <li>Request deletion of your data, subject to legal retention requirements.</li>
        <li>Opt out of marketing communications at any time.</li>
        <li>
          Raise a complaint with the relevant data protection authority if you
          believe your rights have been violated.
        </li>
      </ul>
      <p>
        To exercise these rights, email us at{" "}
        <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use cookies for authentication (keeping you logged in) and
        analytics (understanding how the platform is used). We do not use
        advertising or tracking cookies. You can disable cookies in your
        browser settings, but this may affect your ability to log in.
      </p>

      <h2>9. Children</h2>
      <p>
        Packuptrip is not intended for users under 18. We do not knowingly
        collect personal data from minors. If you believe a minor has created
        an account, please contact us and we will remove it promptly.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy as the platform evolves. Material
        changes will be communicated by email or a notice on the platform.
        Continued use after such notice constitutes acceptance of the updated
        policy.
      </p>

      <hr />

      <p>
        Privacy questions? Write to us at{" "}
        <a href="mailto:hello@packuptrip.com">hello@packuptrip.com</a>.
      </p>
    </ProsePage>
  );
}
