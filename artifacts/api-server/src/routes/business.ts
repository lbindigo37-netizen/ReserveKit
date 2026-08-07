import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, businessTable } from "@workspace/db";
import { GetBusinessResponse, UpdateBusinessBody, UpdateBusinessResponse } from "@workspace/api-zod";

import { requireAdmin } from "../middlewares/session";

const router: IRouter = Router();

async function getOrCreateBusiness() {
  const [existing] = await db.select().from(businessTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(businessTable)
    .values({
      name: "Haven & Hue",
      type: "Salon",
      tagline: "A considered approach to modern beauty.",
      bookingLabel: "Book a stylist",
      currency: "USD",
      timezone: "America/Los_Angeles",
      accent: "#c36b4f",
    })
    .returning();
  return created;
}

router.get("/business", async (_req, res) => {
  const business = await getOrCreateBusiness();
  res.json(GetBusinessResponse.parse(business));
});

router.patch("/business", requireAdmin, async (req, res) => {
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const business = await getOrCreateBusiness();
  const [updated] = await db
    .update(businessTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(businessTable.id, business.id))
    .returning();
  res.json(UpdateBusinessResponse.parse(updated));
});

export default router;
