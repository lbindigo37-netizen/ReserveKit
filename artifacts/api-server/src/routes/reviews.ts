import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, reviewsTable, servicesTable } from "@workspace/db";
import { GetReviewsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (_req, res) => {
  const rows = await db
    .select({ review: reviewsTable, serviceName: servicesTable.name })
    .from(reviewsTable)
    .leftJoin(servicesTable, eq(servicesTable.id, reviewsTable.serviceId))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(
    GetReviewsResponse.parse(
      rows.map(({ review, serviceName }) => ({
        id: review.id,
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        serviceName: serviceName ?? undefined,
      })),
    ),
  );
});

export default router;
