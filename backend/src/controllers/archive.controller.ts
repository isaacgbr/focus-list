import { NextFunction, Request, Response } from "express";

import archiveService from "../services/archive.service.js";

class ArchiveController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findAll());
    } catch (error) { next(error); }
  }

  async findAreaById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findAreaById(Number(req.params.id)));
    } catch (error) { next(error); }
  }

  async findListById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findListById(Number(req.params.id)));
    } catch (error) { next(error); }
  }

  async findListsByAreaId(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findListsByAreaId(Number(req.params.areaId)));
    } catch (error) { next(error); }
  }

  async findTasksByListId(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findTasksByListId(Number(req.params.listId)));
    } catch (error) { next(error); }
  }

  async findTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findTaskById(Number(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new ArchiveController();
