import { Router } from "express";

import taskController from "../controllers/task.controller.js";

const router = Router();

// Rotas do módulo de Tarefas.
router.get("/tasks", taskController.findAll);
router.get("/tasks/:id", taskController.findById);
router.post("/tasks", taskController.create);
router.put("/tasks/:id", taskController.update);
router.delete("/tasks/:id", taskController.delete);

export default router;
