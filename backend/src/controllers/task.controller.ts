import { NextFunction, Request, Response } from "express";

import taskService from "../services/task.service.js";

class TaskController {
  // Lista todas as Tarefas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const listId = req.query.listId === undefined ? undefined : Number(req.query.listId);
      const areaId = req.query.areaId === undefined ? undefined : Number(req.query.areaId);

      if (listId !== undefined && (!Number.isInteger(listId) || listId <= 0)) {
        throw new Error("O filtro de Lista é inválido.");
      }

      if (areaId !== undefined && (!Number.isInteger(areaId) || areaId <= 0)) {
        throw new Error("O filtro de Área é inválido.");
      }

      const tasks = await taskService.findAll({ listId, areaId });

      return res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Tarefa pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const task = await taskService.findById(id);

      return res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Tarefa.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(req.body);

      return res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Tarefa existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const task = await taskService.update(id, req.body);

      return res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Tarefa.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      await taskService.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await taskService.archive(Number(req.params.id)));
    } catch (error) { next(error); }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await taskService.restore(Number(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new TaskController();
