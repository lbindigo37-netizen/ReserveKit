import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, customersTable, customerFavoritesTable, servicesTable, usersTable } from "@workspace/db";
import {
  AddFavoriteParams,
  GetFavoritesResponse,
  GetProfileResponse,
  RemoveFavoriteParams,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

import { requireAuth } from "../middlewares/session";

const router: IRouter = Router();

async function getOrCreateCustomerForUser(userId: number, name: string, email: string) {
  const [existing] = await db.select().from(customersTable).where(eq(customersTable.userId, userId)).limit(1);
  if (existing) return existing;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
  const [created] = await db
    .insert(customersTable)
    .values({ userId, name, email, initials: initials || "U", color: "#c36b4f" })
    .returning();
  return created;
}

router.get("/profile", requireAuth, async (req, res) => {
  const user = req.user!;
  const customer = await getOrCreateCustomerForUser(user.id, user.name, user.email);
  res.json(GetProfileResponse.parse({ id: user.id, name: user.name, email: user.email, phone: customer.phone ?? undefined }));
});

router.patch("/profile", requireAuth, async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = req.user!;
  const customer = await getOrCreateCustomerForUser(user.id, user.name, user.email);

  if (parsed.data.name) {
    await db.update(usersTable).set({ name: parsed.data.name }).where(eq(usersTable.id, user.id));
  }
  await db
    .update(customersTable)
    .set({
      name: parsed.data.name ?? customer.name,
      phone: parsed.data.phone ?? customer.phone,
    })
    .where(eq(customersTable.id, customer.id));

  res.json(
    UpdateProfileResponse.parse({
      id: user.id,
      name: parsed.data.name ?? user.name,
      email: user.email,
      phone: parsed.data.phone ?? customer.phone ?? undefined,
    }),
  );
});

router.get("/favorites", requireAuth, async (req, res) => {
  const user = req.user!;
  const customer = await getOrCreateCustomerForUser(user.id, user.name, user.email);

  const favorites = await db
    .select({ service: servicesTable })
    .from(customerFavoritesTable)
    .innerJoin(servicesTable, eq(servicesTable.id, customerFavoritesTable.serviceId))
    .where(eq(customerFavoritesTable.customerId, customer.id));

  res.json(GetFavoritesResponse.parse(favorites.map(({ service }) => ({ ...service, staffIds: [] }))));
});

router.put("/favorites/:serviceId", requireAuth, async (req, res) => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid service id" });
    return;
  }
  const user = req.user!;
  const customer = await getOrCreateCustomerForUser(user.id, user.name, user.email);

  await db
    .insert(customerFavoritesTable)
    .values({ customerId: customer.id, serviceId: params.data.serviceId })
    .onConflictDoNothing();
  res.status(204).end();
});

router.delete("/favorites/:serviceId", requireAuth, async (req, res) => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid service id" });
    return;
  }
  const user = req.user!;
  const customer = await getOrCreateCustomerForUser(user.id, user.name, user.email);

  await db
    .delete(customerFavoritesTable)
    .where(
      and(
        eq(customerFavoritesTable.customerId, customer.id),
        eq(customerFavoritesTable.serviceId, params.data.serviceId),
      ),
    );
  res.status(204).end();
});

export default router;
