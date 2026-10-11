import { NextFunction, Request, Response } from "express";

import checklistItemService from "../services/checklist-item.service.js";

class ChecklistItemController {
  // Lista todos os itens de checklist.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const checklistItems = await checklistItemService.findAll();

      return res.status(200).json(checklistItems);
    } catch (error) {
      next(error);
    }
  }

  // Busca um item de checklist pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const checklistItem = await checklistItemService.findById(id);

      return res.status(200).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Cria um novo item de checklist.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const checklistItem = await checklistItemService.create(req.body);

      return res.status(201).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza um item de checklist existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const checklistItem = await checklistItemService.update(id, req.body);

      return res.status(200).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Remove um item de checklist.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      await checklistItemService.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ChecklistItemController();
