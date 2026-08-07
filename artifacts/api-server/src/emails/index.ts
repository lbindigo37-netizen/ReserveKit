import type { BookingEmailKind } from "../lib/notify";

export type RenderedEmail = { subject: string; html: string };

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: 'DM Sans', Arial, sans-serif; background:#f5efe3; margin:0; padding:32px;">
    <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#fffdf9; border-radius:16px; overflow:hidden;">
      <tr><td style="background:#c36b4f; padding:24px; color:#fffdf9; font-size:20px; font-weight:700;">${escapeHtml(title)}</td></tr>
      <tr><td style="padding:24px; color:#26313d; font-size:15px; line-height:1.6;">${bodyHtml}</td></tr>
      <tr><td style="padding:16px 24px; color:#8a8578; font-size:12px;">Sent by ReserveKit</td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function detailRow(label: string, value: string | number): string {
  return `<p style="margin:4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

/**
 * Renders a booking-related transactional email. Designed to be swapped for
 * React Email / MJML templates later; the Resend send call in
 * `lib/notify.ts` only depends on this returning `{ subject, html }`.
 */
export function renderBookingEmail(
  kind: BookingEmailKind,
  context: Record<string, string | number>,
): RenderedEmail {
  const { customerName, service, staff, date, time, businessName } = context;
  const details = `${detailRow("Service", service)}${detailRow("With", staff)}${detailRow("Date", date)}${detailRow("Time", time)}`;

  switch (kind) {
    case "confirmation":
      return {
        subject: `You're booked at ${businessName}`,
        html: layout(
          "Booking confirmed",
          `<p>Hi ${escapeHtml(customerName)},</p><p>Your appointment is confirmed.</p>${details}`,
        ),
      };
    case "reminder":
      return {
        subject: `Reminder: your appointment at ${businessName}`,
        html: layout(
          "See you soon",
          `<p>Hi ${escapeHtml(customerName)},</p><p>Just a reminder about your upcoming appointment.</p>${details}`,
        ),
      };
    case "cancelled":
      return {
        subject: `Your appointment at ${businessName} was cancelled`,
        html: layout(
          "Booking cancelled",
          `<p>Hi ${escapeHtml(customerName)},</p><p>Your appointment has been cancelled.</p>${details}`,
        ),
      };
    case "completed":
      return {
        subject: `Thanks for visiting ${businessName}`,
        html: layout(
          "Hope you enjoyed it",
          `<p>Hi ${escapeHtml(customerName)},</p><p>Thanks for coming in. We would love to see you again.</p>${details}`,
        ),
      };
  }
}
