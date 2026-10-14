import { Router } from "express";

import archiveController from "../controllers/archive.controller.js";

const router = Router();

router.get("/archived", archiveController.findAll);
router.get("/archived/areas/:id", archiveController.findAreaById);
router.get("/archived/lists/:id", archiveController.findListById);
router.get("/archived/tasks/:id", archiveController.findTaskById);

export default router;
