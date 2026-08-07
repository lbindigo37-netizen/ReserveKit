import { db, notificationsTable } from "@workspace/db";
import { logger } from "./logger";

export type BookingEmailKind = "confirmation" | "reminder" | "cancelled" | "completed";

/**
 * Sends a transactional booking email. Designed for Resend: when
 * `RESEND_API_KEY` is configured this posts to the Resend API using the
 * templates in `../emails`; otherwise it logs the rendered email so the
 * booking flow keeps working end-to-end in local/demo environments without
 * requiring provider credentials.
 */
export async function sendBookingEmail(
  kind: BookingEmailKind,
  to: string,
  context: Record<string, string | number>,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const { renderBookingEmail } = await import("../emails");
  const rendered = renderBookingEmail(kind, context);

  if (!apiKey) {
    logger.info({ to, kind, subject: rendered.subject }, "Email not sent (RESEND_API_KEY not configured); logging instead");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "bookings@resend.dev",
      to,
      subject: rendered.subject,
      html: rendered.html,
    }),
  });

  if (!response.ok) {
    logger.error({ status: response.status, to, kind }, "Failed to send booking email via Resend");
  }
}

/** Writes an in-app notification for a user. Best-effort: failures are logged, not thrown. */
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({ userId, type, title, body });
  } catch (err) {
    logger.error({ err, userId, type }, "Failed to create notification");
  }
}
