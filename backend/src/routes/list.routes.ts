import { Router } from "express";

import listController from "../controllers/list.controller.js";

const router = Router();

// Rotas do módulo de Listas.
router.get("/lists", listController.findAll);
router.get("/lists/:id", listController.findById);
router.post("/lists", listController.create);
router.put("/lists/:id", listController.update);
router.patch("/lists/:id/archive", listController.archive);
router.patch("/lists/:id/restore", listController.restore);
router.delete("/lists/:id", listController.delete);

export default router;
