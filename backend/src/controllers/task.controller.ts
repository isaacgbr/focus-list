import { NextFunction, Request, Response } from "express";

import taskService from "../services/task.service.js";

class TaskController {
  // Lista todas as Tarefas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.findAll();

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
}

export default new TaskController();
