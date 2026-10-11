import { NextFunction, Request, Response } from "express";

import linkService from "../services/link.service.js";

class LinkController {
  // Lista todos os Links.
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await linkService.findAll();

      return res.status(200).json(links);
    } catch (error) {
      next(error);
    }
  }

  // Busca um Link pelo ID.
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const link = await linkService.findById(id);

      return res.status(200).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Cria um novo Link.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await linkService.create(req.body);

      return res.status(201).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Atualiza um Link existente.
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const link = await linkService.update(id, req.body);

      return res.status(200).json(link);
    } catch (error) {
      next(error);
    }
  }

  // Remove um Link.
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      await linkService.delete(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new LinkController();
