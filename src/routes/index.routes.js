import * as express from "express";

import userRoutes from "./user/user.routes.js";
import adminRoutes from "./admin/admin.routes.js";
import jobRoutes from "./jobs/jobs.routes.js"

const router = express.Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/jobs", jobRoutes);

export default router;