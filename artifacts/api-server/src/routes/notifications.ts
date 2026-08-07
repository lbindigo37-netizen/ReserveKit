import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { GetNotificationsResponse, MarkNotificationReadParams, MarkNotificationReadResponse } from "@workspace/api-zod";

import { requireAuth } from "../middlewares/session";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt));

  res.json(
    GetNotificationsResponse.parse(
      rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    ),
  );
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid notification id" });
    return;
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!updated || updated.userId !== req.user!.id) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse({ ...updated, createdAt: updated.createdAt.toISOString() }));
});

export default router;
