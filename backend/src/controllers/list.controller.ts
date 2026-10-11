import { NextFunction, Request, Response } from "express";

import listService from "../services/list.service.js";

class ListController {
  // Lista todas as Listas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const lists = await listService.findAll();

      return res.status(200).json(lists);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Lista pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const list = await listService.findById(id);

      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Lista.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await listService.create(req.body);

      return res.status(201).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Lista existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const list = await listService.update(id, req.body);

      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Lista.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      await listService.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ListController();
