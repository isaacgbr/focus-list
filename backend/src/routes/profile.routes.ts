import express, { Router } from "express";
import profileController from "../controllers/profile.controller.js";
import { authenticated } from "../middlewares/auth.middleware.js";
import { authRateLimit } from "../middlewares/auth-rate-limit.middleware.js";
import { HttpError } from "../utils/http-error.js";

const router = Router();
router.use("/profile", (req, _res, next) => {
  if (authenticated(req).type !== "REAL") throw new HttpError(403, "Perfil disponível apenas para contas FocusList.");
  next();
});
router.get("/profile", profileController.get);
router.patch("/profile", authRateLimit, profileController.update);
router.post("/profile/password", authRateLimit, profileController.password);
router.patch("/profile/preferences", profileController.preferences);
router.get("/profile/avatar", profileController.avatar);
router.put("/profile/avatar", authRateLimit, express.json({ limit: "180kb" }), profileController.setAvatar);
router.delete("/profile/avatar", profileController.removeAvatar);
export default router;
