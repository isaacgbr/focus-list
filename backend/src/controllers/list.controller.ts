import { authenticated } from "../middlewares/auth.middleware.js";
import { domainBody, positiveId } from "../utils/validation.js";
import { NextFunction, Request, Response } from "express";

import listService from "../services/list.service.js";

class ListController {
  // Lista todas as Listas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = req.query.areaId === undefined ? undefined : positiveId(req.query.areaId);

      const lists = await listService.findAll(authenticated(req).userId, areaId);

      return res.status(200).json(lists);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Lista pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const list = await listService.findById(authenticated(req).userId, id);

      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Lista.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await listService.create(authenticated(req).userId, domainBody(req.body, ["title","description","areaId"], ["title","areaId"]) as Parameters<typeof listService.create>[1]);

      return res.status(201).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Lista existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const list = await listService.update(authenticated(req).userId, id, domainBody(req.body, ["title","description","areaId"]) as Parameters<typeof listService.update>[2]);

      return res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Lista.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      await listService.delete(authenticated(req).userId, id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await listService.archive(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await listService.restore(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new ListController();
