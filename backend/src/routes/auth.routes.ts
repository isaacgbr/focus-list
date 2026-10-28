import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authRateLimit } from "../middlewares/auth-rate-limit.middleware.js";

const router = Router();
router.use("/auth", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.post("/auth/register", authRateLimit, authController.register);
router.post("/auth/login", authRateLimit, authController.login);
router.post("/auth/forgot-password", authRateLimit, authController.forgotPassword);
router.post("/auth/reset-password", authRateLimit, authController.resetPassword);
router.get("/auth/session", requireAuth, authController.session);
router.post("/auth/logout", requireAuth, authController.logout);

export default router;
