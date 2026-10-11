import { Router } from "express";

import checklistItemController from "../controllers/checklist-item.controller.js";

const router = Router();

// Rotas do módulo de itens de checklist.
router.get("/checklist-items", checklistItemController.findAll);
router.get("/checklist-items/:id", checklistItemController.findById);
router.post("/checklist-items", checklistItemController.create);
router.put("/checklist-items/:id", checklistItemController.update);
router.delete("/checklist-items/:id", checklistItemController.delete);

export default router;
