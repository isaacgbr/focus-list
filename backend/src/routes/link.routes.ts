import { Router } from "express";

import linkController from "../controllers/link.controller.js";

const router = Router();

// Rotas do módulo de Links.
router.get("/links", linkController.findAll);
router.get("/links/:id", linkController.findById);
router.post("/links", linkController.create);
router.put("/links/:id", linkController.update);
router.delete("/links/:id", linkController.delete);

export default router;
