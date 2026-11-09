import type { Request, Response } from "express";
import { authenticated } from "../middlewares/auth.middleware.js";
import profileService from "../services/profile.service.js";
import { allowedBody } from "../utils/validation.js";

class ProfileController {
  async get(req: Request, res: Response) {
    return res.json({ profile: await profileService.get(authenticated(req).userId) });
  }
  async update(req: Request, res: Response) {
    const { userId, sessionId } = authenticated(req);
    return res.json({ profile: await profileService.update(userId, sessionId, req.body) });
  }
  async password(req: Request, res: Response) {
    const { userId, sessionId } = authenticated(req);
    return res.json(await profileService.changePassword(userId, sessionId, req.body));
  }
  async preferences(req: Request, res: Response) {
    const { userId, sessionId } = authenticated(req);
    return res.json({ profile: await profileService.preferences(userId, sessionId, req.body) });
  }
  async avatar(req: Request, res: Response) {
    const image = await profileService.avatar(authenticated(req).userId);
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Content-Disposition", 'inline; filename="avatar.jpg"');
    return res.type("image/jpeg").send(image);
  }
  async setAvatar(req: Request, res: Response) {
    const { userId, sessionId } = authenticated(req);
    return res.json({ profile: await profileService.setAvatar(userId, sessionId, req.body) });
  }
  async removeAvatar(req: Request, res: Response) {
    if (req.body !== undefined) allowedBody(req.body, []);
    const { userId, sessionId } = authenticated(req);
    return res.json({ profile: await profileService.removeAvatar(userId, sessionId) });
  }
}
export default new ProfileController();
