import { NextFunction, Request, Response } from "express";

import archiveService from "../services/archive.service.js";
import { authenticated } from "../middlewares/auth.middleware.js";
import { positiveId } from "../utils/validation.js";

class ArchiveController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findAll(authenticated(req).userId));
    } catch (error) { next(error); }
  }

  async findAreaById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findAreaById(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }

  async findListById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findListById(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }

  async findTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(await archiveService.findTaskById(authenticated(req).userId, positiveId(req.params.id)));
    } catch (error) { next(error); }
  }
}

export default new ArchiveController();
