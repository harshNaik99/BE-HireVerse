import * as express from "express";

import userRoutes from "./user/user.routes.js";
import adminRoutes from "./admin/admin.routes.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);

export default router;