import { authenticated } from "../middlewares/auth.middleware.js";
import { domainBody, positiveId } from "../utils/validation.js";
import { NextFunction, Request, Response } from "express";

import areaService from "../services/area.service.js";

class AreaController {
  // Lista todas as Áreas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await areaService.findAll(authenticated(req).userId);

      return res.status(200).json(areas);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Área pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const area = await areaService.findById(authenticated(req).userId, id);

      return res.status(200).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Área.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await areaService.create(authenticated(req).userId, domainBody(req.body, ["title","description","color","icon"], ["title"]) as Parameters<typeof areaService.create>[1]);

      return res.status(201).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Área existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      const area = await areaService.update(authenticated(req).userId, id, domainBody(req.body, ["title","description","color","icon"]) as Parameters<typeof areaService.update>[2]);

      return res.status(200).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Área.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = positiveId(req.params.id);

      await areaService.delete(authenticated(req).userId, id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await areaService.archive(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await areaService.restore(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new AreaController();
