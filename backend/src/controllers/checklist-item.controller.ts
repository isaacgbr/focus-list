import { authenticated } from "../middlewares/auth.middleware.js";
import { domainBody, positiveId } from "../utils/validation.js";
import { NextFunction, Request, Response } from "express";

import checklistItemService from "../services/checklist-item.service.js";

class ChecklistItemController {
  // Lista todos os itens de checklist.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.query.taskId === undefined ? undefined : positiveId(req.query.taskId);
      const listId = req.query.listId === undefined ? undefined : positiveId(req.query.listId);


      const checklistItems = await checklistItemService.findAll(authenticated(req).userId, { taskId, listId });

      return res.status(200).json(checklistItems);
    } catch (error) {
      next(error);
    }
  }

  // Busca um item de checklist pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const checklistItem = await checklistItemService.findById(authenticated(req).userId, id);

      return res.status(200).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Cria um novo item de checklist.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const checklistItem = await checklistItemService.create(authenticated(req).userId, domainBody(req.body, ["title","text","completed","taskId"], ["taskId"]) as Parameters<typeof checklistItemService.create>[1]);

      return res.status(201).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza um item de checklist existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const checklistItem = await checklistItemService.update(authenticated(req).userId, id, domainBody(req.body, ["title","text","completed","taskId"]) as Parameters<typeof checklistItemService.update>[2]);

      return res.status(200).json(checklistItem);
    } catch (error) {
      next(error);
    }
  }

  // Remove um item de checklist.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      await checklistItemService.delete(authenticated(req).userId, id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new ChecklistItemController();
