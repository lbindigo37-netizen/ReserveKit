import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, servicesTable, serviceStaffTable, type Service } from "@workspace/db";
import {
  CreateServiceBody,
  CreateServiceResponse,
  DeleteServiceParams,
  GetServicesQueryParams,
  GetServicesResponse,
  UpdateServiceBody,
  UpdateServiceParams,
  UpdateServiceResponse,
} from "@workspace/api-zod";

import { requireAdmin } from "../middlewares/session";

const router: IRouter = Router();

async function withStaffIds(services: Service[]) {
  if (services.length === 0) return [];
  const links = await db
    .select()
    .from(serviceStaffTable)
    .where(inArray(serviceStaffTable.serviceId, services.map((service) => service.id)));
  return services.map((service) => ({
    ...service,
    staffIds: links.filter((link) => link.serviceId === service.id).map((link) => link.staffId),
  }));
}

router.get("/services", async (req, res) => {
  const parsed = GetServicesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db.select().from(servicesTable);
  const filtered = parsed.data.includeInactive ? rows : rows.filter((service) => service.active);
  res.json(GetServicesResponse.parse(await withStaffIds(filtered)));
});

router.post("/services", requireAdmin, async (req, res) => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { staffIds, ...serviceInput } = parsed.data;
  const [service] = await db.insert(servicesTable).values(serviceInput).returning();

  if (staffIds?.length) {
    await db.insert(serviceStaffTable).values(staffIds.map((staffId) => ({ serviceId: service.id, staffId })));
  }

  const [withIds] = await withStaffIds([service]);
  res.status(201).json(CreateServiceResponse.parse(withIds));
});

router.patch("/services/:id", requireAdmin, async (req, res) => {
  const params = UpdateServiceParams.safeParse(req.params);
  const body = UpdateServiceBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid service update" });
    return;
  }
  const { staffIds, ...serviceInput } = body.data;

  const [updated] = await db
    .update(servicesTable)
    .set(serviceInput)
    .where(eq(servicesTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  if (staffIds !== undefined) {
    await db.delete(serviceStaffTable).where(eq(serviceStaffTable.serviceId, updated.id));
    if (staffIds.length) {
      await db.insert(serviceStaffTable).values(staffIds.map((staffId) => ({ serviceId: updated.id, staffId })));
    }
  }

  const [withIds] = await withStaffIds([updated]);
  res.json(UpdateServiceResponse.parse(withIds));
});

router.delete("/services/:id", requireAdmin, async (req, res) => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid service id" });
    return;
  }
  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  res.status(204).end();
});

export default router;
