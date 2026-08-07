import { Router, type IRouter } from "express";
import { GetAvailabilityQueryParams, GetAvailabilityResponse } from "@workspace/api-zod";

import { computeAvailableSlots, NotFoundError } from "../lib/availability";
import { isValidDateString } from "../lib/time";

const router: IRouter = Router();

router.get("/availability", async (req, res) => {
  const parsed = GetAvailabilityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { serviceId, staffId, date } = parsed.data;
  if (!isValidDateString(date)) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  try {
    const slots = await computeAvailableSlots(serviceId, staffId, date);
    res.json(GetAvailabilityResponse.parse({ date, slots }));
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
