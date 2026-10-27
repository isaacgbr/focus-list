import type { NextFunction, Request, Response } from "express";
import authRepository from "../repositories/auth.repository.js";
import { cookieName, cookieOptions, sessionToken, tokenHash } from "../security/session.js";
import { HttpError } from "../utils/http-error.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: number; sessionId: number };
    }
  }
}

export function authenticated(req: Request) {
  if (!req.auth) throw new HttpError(401, "Autenticação necessária.");
  return req.auth;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = sessionToken(req);
  const session = token ? await authRepository.findValidSession(tokenHash(token)) : null;
  res.setHeader("Cache-Control", "no-store");
  if (!session) {
    res.clearCookie(cookieName, cookieOptions);
    throw new HttpError(401, "Autenticação necessária.");
  }
  req.auth = { userId: session.userId, sessionId: session.id };
  next();
}
