import type { Request, Response } from "express";
import authService from "../services/auth.service.js";
import { authenticated } from "../middlewares/auth.middleware.js";
import { cookieName, cookieOptions, SESSION_DURATION, sessionToken } from "../security/session.js";
import { allowedBody } from "../utils/validation.js";

class AuthController {
  async register(req: Request, res: Response) {
    return res.status(201).json({ user: await authService.register(req.body) });
  }

  async login(req: Request, res: Response) {
    const { user, token, expiresAt } = await authService.login(req.body, sessionToken(req));
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: SESSION_DURATION, expires: expiresAt });
    return res.status(200).json({ user });
  }

  async session(req: Request, res: Response) {
    return res.json({ user: await authService.session(authenticated(req).userId) });
  }

  async logout(req: Request, res: Response) {
    if (req.body !== undefined) allowedBody(req.body, []);
    const { sessionId, userId } = authenticated(req);
    await authService.logout(sessionId, userId);
    res.clearCookie(cookieName, cookieOptions);
    return res.status(204).send();
  }
}

export default new AuthController();
