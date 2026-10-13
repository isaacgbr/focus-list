import { Router } from "express";

import areaController from "../controllers/area.controller.js";

const router = Router();

// Rotas do módulo de Áreas.
router.get("/areas", areaController.findAll);
router.get("/areas/:id", areaController.findById);
router.post("/areas", areaController.create);
router.put("/areas/:id", areaController.update);
router.patch("/areas/:id/archive", areaController.archive);
router.patch("/areas/:id/restore", areaController.restore);
router.delete("/areas/:id", areaController.delete);

export default router;
