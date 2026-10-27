import { authenticated } from "../middlewares/auth.middleware.js";
import { domainBody, positiveId } from "../utils/validation.js";
import { NextFunction, Request, Response } from "express";

import taskService from "../services/task.service.js";

class TaskController {
  // Lista todas as Tarefas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const listId = req.query.listId === undefined ? undefined : positiveId(req.query.listId);
      const areaId = req.query.areaId === undefined ? undefined : positiveId(req.query.areaId);


      const tasks = await taskService.findAll(authenticated(req).userId, { listId, areaId });

      return res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Tarefa pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const task = await taskService.findById(authenticated(req).userId, id);

      return res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Tarefa.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(authenticated(req).userId, domainBody(req.body, ["title","description","dueDate","priority","completed","completedAt","listId"], ["title","listId"]) as Parameters<typeof taskService.create>[1]);

      return res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Tarefa existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const task = await taskService.update(authenticated(req).userId, id, domainBody(req.body, ["title","description","dueDate","priority","completed","completedAt","listId"]) as Parameters<typeof taskService.update>[2]);

      return res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Tarefa.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      await taskService.delete(authenticated(req).userId, id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await taskService.archive(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await taskService.restore(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new TaskController();
