import { Router } from "express";
import demoController from "../controllers/demo.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authRateLimit } from "../middlewares/auth-rate-limit.middleware.js";

const router = Router();
router.use("/auth/demo", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.post("/auth/demo", authRateLimit, demoController.start);
router.post("/auth/demo/exit", requireAuth, demoController.exit);
router.post("/auth/demo/resolve", requireAuth, demoController.resolve);
export default router;
