import type { Request, Response } from "express";
import demoService from "../services/demo.service.js";
import { authenticated } from "../middlewares/auth.middleware.js";
import { cookieName, cookieOptions, sessionToken } from "../security/session.js";

class DemoController {
  async start(req: Request, res: Response) {
    const { user, token, expiresAt } = await demoService.start(req.body, sessionToken(req));
    res.cookie(cookieName, token, { ...cookieOptions, expires: expiresAt });
    return res.json({ user });
  }

  async exit(req: Request, res: Response) {
    const { sessionId, userId, type } = authenticated(req);
    await demoService.exit(sessionId, userId, type, req.body);
    res.clearCookie(cookieName, cookieOptions);
    return res.status(204).send();
  }

  async resolve(req: Request, res: Response) {
    const { sessionId, userId, type } = authenticated(req);
    await demoService.resolve(sessionId, userId, type, req.body);
    // Nunca reemite cookie Demo; a sessão REAL continua ativa.
    return res.status(204).send();
  }
}

export default new DemoController();
