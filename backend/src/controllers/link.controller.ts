import { authenticated } from "../middlewares/auth.middleware.js";
import { domainBody, positiveId } from "../utils/validation.js";
import { NextFunction, Request, Response } from "express";

import linkService from "../services/link.service.js";

class LinkController {
  // Lista todos os Links.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.query.taskId === undefined ? undefined : positiveId(req.query.taskId);
      const listId = req.query.listId === undefined ? undefined : positiveId(req.query.listId);


      const links = await linkService.findAll(authenticated(req).userId, { taskId, listId });

      return res.status(200).json(links);
    } catch (error) {
      next(error);
    }
  }

  // Busca um Link pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const link = await linkService.findById(authenticated(req).userId, id);

      return res.status(200).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Cria um novo Link.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await linkService.create(authenticated(req).userId, domainBody(req.body, ["title","url","taskId"], ["title","url","taskId"]) as Parameters<typeof linkService.create>[1]);

      return res.status(201).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza um Link existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const link = await linkService.update(authenticated(req).userId, id, domainBody(req.body, ["title","url","taskId"]) as Parameters<typeof linkService.update>[2]);

      return res.status(200).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Remove um Link.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      await linkService.delete(authenticated(req).userId, id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new LinkController();
