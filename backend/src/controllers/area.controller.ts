import { NextFunction, Request, Response } from "express";

import areaService from "../services/area.service.js";

class AreaController {
  // Lista todas as Áreas.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await areaService.findAll();

      return res.status(200).json(areas);
    } catch (error) {
      next(error);
    }
  }

  // Busca uma Área pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const area = await areaService.findById(id);

      return res.status(200).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Cria uma nova Área.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await areaService.create(req.body);

      return res.status(201).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza uma Área existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const area = await areaService.update(id, req.body);

      return res.status(200).json(area);
    } catch (error) {
      next(error);
    }
  }

  // Remove uma Área.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      await areaService.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await areaService.archive(Number(req.params.id)));
    } catch (error) { next(error); }
  }

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await areaService.restore(Number(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new AreaController();
