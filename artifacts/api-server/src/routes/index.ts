import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessRouter from "./business";
import servicesRouter from "./services";
import staffRouter from "./staff";
import availabilityRouter from "./availability";
import bookingsRouter from "./bookings";
import customersRouter from "./customers";
import profileRouter from "./profile";
import notificationsRouter from "./notifications";
import reviewsRouter from "./reviews";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(businessRouter);
router.use(servicesRouter);
router.use(staffRouter);
router.use(availabilityRouter);
router.use(bookingsRouter);
router.use(customersRouter);
router.use(profileRouter);
router.use(notificationsRouter);
router.use(reviewsRouter);
router.use(dashboardRouter);

export default router;
