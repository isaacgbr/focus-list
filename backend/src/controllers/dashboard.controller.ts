import { NextFunction, Request, Response } from "express";

import dashboardService from "../services/dashboard.service.js";

class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const today = typeof req.query.today === "string" ? req.query.today : "";
      return res.status(200).json(await dashboardService.getSummary(today));
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
