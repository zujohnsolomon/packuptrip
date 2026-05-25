/**
 * Packuptrip transactional email via Resend.
 *
 * All send functions are no-ops when RESEND_API_KEY is unset —
 * no errors thrown, just a console.warn. Drop in the key and
 * emails start flowing immediately, no other code changes needed.
 */

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Packuptrip <hello@packuptrip.com>";

// Lazy-init so the module can be imported even without the key
let _resend: Resend | null = null;
function resend(): Resend | null {
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

type SendResult = { ok: boolean; error?: string };

async function send(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const client = resend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", opts.to);
    return { ok: true }; // silent no-op in dev
  }
  const { error } = await client.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ─── Templates ───────────────────────────────────────────────────────────────

/** Host gets this the moment someone books their trip */
export async function sendBookingReceivedEmail(opts: {
  hostEmail: string;
  hostName: string;
  joinerName: string;
  tripTitle: string;
  tripLocation: string;
  joinersUrl: string;
}) {
  return send({
    to: opts.hostEmail,
    subject: `${opts.joinerName} joined your trip — ${opts.tripTitle}`,
    html: template({
      preview: `${opts.joinerName} just reserved a spot on your trip to ${opts.tripLocation}.`,
      body: `
        <p>Hi ${opts.hostName},</p>
        <p>
          Good news — <strong>${opts.joinerName}</strong> just booked a spot on
          your trip <strong>"${opts.tripTitle}"</strong> to ${opts.tripLocation}.
        </p>
        <p>Head over to your joiner list to see their details and start the conversation.</p>
      `,
      ctaLabel: "See your joiners →",
      ctaUrl: opts.joinersUrl,
    }),
  });
}

/** Joiner gets this when their booking is confirmed */
export async function sendBookingConfirmedEmail(opts: {
  joinerEmail: string;
  joinerName: string;
  tripTitle: string;
  tripLocation: string;
  startDate: string;
  bookingUrl: string;
}) {
  return send({
    to: opts.joinerEmail,
    subject: `You're in! ${opts.tripTitle}`,
    html: template({
      preview: `Your spot on ${opts.tripTitle} is confirmed. Pack your bags.`,
      body: `
        <p>Hi ${opts.joinerName},</p>
        <p>
          Your spot on <strong>"${opts.tripTitle}"</strong> to
          ${opts.tripLocation} is confirmed.
        </p>
        <p>
          <strong>Trip starts:</strong> ${opts.startDate}<br/>
          Keep an eye on your messages — your host will reach out with details.
        </p>
      `,
      ctaLabel: "View your booking →",
      ctaUrl: opts.bookingUrl,
    }),
  });
}

/** Host gets this when their trip is approved and goes live */
export async function sendTripApprovedEmail(opts: {
  hostEmail: string;
  hostName: string;
  tripTitle: string;
  tripUrl: string;
}) {
  return send({
    to: opts.hostEmail,
    subject: `Your trip is live — ${opts.tripTitle}`,
    html: template({
      preview: `"${opts.tripTitle}" has been approved and is now visible to travellers.`,
      body: `
        <p>Hi ${opts.hostName},</p>
        <p>
          Great news — your trip <strong>"${opts.tripTitle}"</strong> has been
          reviewed and is now <strong>live on Packuptrip</strong>.
        </p>
        <p>
          Travellers can find and book it right now. Share your trip link to
          get the first joiners rolling in.
        </p>
      `,
      ctaLabel: "View your live trip →",
      ctaUrl: opts.tripUrl,
    }),
  });
}

/** Host gets this when their trip is rejected */
export async function sendTripRejectedEmail(opts: {
  hostEmail: string;
  hostName: string;
  tripTitle: string;
  reason: string;
  editUrl: string;
}) {
  return send({
    to: opts.hostEmail,
    subject: `Your trip needs a few changes — ${opts.tripTitle}`,
    html: template({
      preview: `We reviewed your trip and have some feedback before it goes live.`,
      body: `
        <p>Hi ${opts.hostName},</p>
        <p>
          We reviewed your trip <strong>"${opts.tripTitle}"</strong> and it
          needs a few changes before we can publish it.
        </p>
        <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#78716c;margin:16px 0;">
          ${opts.reason}
        </blockquote>
        <p>Make the changes and resubmit — our team will re-review within 24 hours.</p>
      `,
      ctaLabel: "Edit your trip →",
      ctaUrl: opts.editUrl,
    }),
  });
}

/** User gets this when ID verification is approved */
export async function sendVerificationApprovedEmail(opts: {
  userEmail: string;
  userName: string;
  profileUrl: string;
}) {
  return send({
    to: opts.userEmail,
    subject: "Your identity is verified ✓",
    html: template({
      preview: "You now have the ID Verified badge on your Packuptrip profile.",
      body: `
        <p>Hi ${opts.userName},</p>
        <p>
          Your identity has been verified. Your profile now displays the
          <strong>ID Verified</strong> badge — a signal that builds trust with
          hosts and fellow travellers.
        </p>
        <p>Get out there and find your next trip.</p>
      `,
      ctaLabel: "View your profile →",
      ctaUrl: opts.profileUrl,
    }),
  });
}

/** User gets this when ID verification is rejected */
export async function sendVerificationRejectedEmail(opts: {
  userEmail: string;
  userName: string;
  reason: string;
  resubmitUrl: string;
}) {
  return send({
    to: opts.userEmail,
    subject: "Action needed — please resubmit your ID",
    html: template({
      preview: "We couldn't verify your identity. Here's what to fix.",
      body: `
        <p>Hi ${opts.userName},</p>
        <p>
          We reviewed your documents but weren't able to verify your identity
          this time. Here's the reason:
        </p>
        <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#78716c;margin:16px 0;">
          ${opts.reason}
        </blockquote>
        <p>You can resubmit with updated documents — it usually takes less than 2 minutes.</p>
      `,
      ctaLabel: "Resubmit documents →",
      ctaUrl: opts.resubmitUrl,
    }),
  });
}

/** Recipient gets this when they receive a new message (digest — not per-message) */
export async function sendNewMessageEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  preview: string;
  threadUrl: string;
}) {
  return send({
    to: opts.recipientEmail,
    subject: `New message from ${opts.senderName}`,
    html: template({
      preview: `${opts.senderName}: ${opts.preview}`,
      body: `
        <p>Hi ${opts.recipientName},</p>
        <p>You have a new message from <strong>${opts.senderName}</strong>:</p>
        <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#78716c;margin:16px 0;">
          ${opts.preview}
        </blockquote>
      `,
      ctaLabel: "Reply →",
      ctaUrl: opts.threadUrl,
    }),
  });
}

// ─── Base HTML template ───────────────────────────────────────────────────────

function template(opts: {
  preview: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://packuptrip.vercel.app";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Packuptrip</title>
  <!-- preview text (hidden) -->
  <span style="display:none;overflow:hidden;max-height:0;max-width:0;opacity:0;">${opts.preview}</span>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Inter',system-ui,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;">
          <a href="${base}" style="text-decoration:none;">
            <span style="font-size:22px;font-weight:700;color:#1c1917;letter-spacing:-0.5px;">
              Packuptrip
            </span>
            <span style="font-size:11px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:2px;margin-left:6px;">
              ✦
            </span>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:36px 36px 32px;box-shadow:0 1px 3px rgba(0,0,0,.06);">
          ${opts.body}

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td>
              <a href="${opts.ctaUrl}"
                 style="display:inline-block;background:#d97706;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;text-decoration:none;">
                ${opts.ctaLabel}
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="font-size:12px;color:#a8a29e;margin:0;">
            You're receiving this because you have an account on
            <a href="${base}" style="color:#a8a29e;">packuptrip.com</a>.
          </p>
          <p style="font-size:12px;color:#a8a29e;margin:8px 0 0;">
            © ${new Date().getFullYear()} Packuptrip
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
