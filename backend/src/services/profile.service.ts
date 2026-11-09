import { Prisma } from "@prisma/client";
import profileRepository from "../repositories/profile.repository.js";
import avatarRepository from "../repositories/avatar.repository.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import { avatarImage } from "../security/avatar.js";
import { HttpError } from "../utils/http-error.js";
import { allowedBody } from "../utils/validation.js";
import { withAvatar } from "../utils/public-profile.js";
import { normalizedEmail, validPassword } from "./auth.service.js";

async function currentHash(userId: number, value: unknown) {
  const password = validPassword(value);
  const account = await profileRepository.findCredentials(userId);
  if (!await verifyPassword(password, account?.passwordHash) || !account?.passwordHash) throw new HttpError(400, "Senha atual incorreta.");
  return account.passwordHash;
}

async function discardPhoto(key: string | null) {
  try { await avatarRepository.remove(key); }
  catch { console.error("Não foi possível remover uma foto de perfil obsoleta."); }
}

class ProfileService {
  async get(userId: number) { return withAvatar(await profileRepository.find(userId)); }

  async update(userId: number, sessionId: number, value: unknown) {
    const body = allowedBody(value, ["name", "email", "currentPassword"]);
    const data: { name?: string; email?: string } = {};
    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || [...name].length > 100 || /[\u0000-\u001f\u007f]/.test(name)) throw new HttpError(400, "Nome inválido (1 a 100 caracteres).");
      data.name = name;
    }
    let expectedHash: string | undefined;
    if (body.email !== undefined) {
      data.email = normalizedEmail(body.email);
      expectedHash = await currentHash(userId, body.currentPassword);
    } else if (body.currentPassword !== undefined) throw new HttpError(400, "Informe o e-mail que deseja alterar.");
    if (!Object.keys(data).length) throw new HttpError(400, "Informe nome ou e-mail para atualizar.");
    try { return withAvatar((await profileRepository.update(userId, sessionId, data, expectedHash)).profile); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new HttpError(400, "Não foi possível usar esse e-mail. Informe outro endereço.");
      throw error;
    }
  }

  async changePassword(userId: number, sessionId: number, value: unknown) {
    const body = allowedBody(value, ["currentPassword", "newPassword", "confirmPassword"]);
    const password = validPassword(body.newPassword);
    if (body.confirmPassword !== password) throw new HttpError(400, "A confirmação da senha não confere.");
    const expectedHash = await currentHash(userId, body.currentPassword);
    await profileRepository.changePassword(userId, sessionId, expectedHash, await hashPassword(password));
    return { message: "Senha alterada. As outras sessões foram encerradas." };
  }

  async preferences(userId: number, sessionId: number, value: unknown) {
    const body = allowedBody(value, ["defaultView"]);
    if (body.defaultView !== "list" && body.defaultView !== "cards") throw new HttpError(400, "Escolha Lista ou Cards.");
    return withAvatar((await profileRepository.update(userId, sessionId, { defaultView: body.defaultView })).profile);
  }

  async avatar(userId: number) {
    const { avatarKey } = await profileRepository.find(userId);
    if (!avatarKey) throw new HttpError(404, "Foto não encontrada.");
    return avatarRepository.read(avatarKey);
  }

  async setAvatar(userId: number, sessionId: number, value: unknown) {
    const body = allowedBody(value, ["image"]);
    const key = await avatarRepository.save(avatarImage(body.image));
    let result;
    try { result = await profileRepository.update(userId, sessionId, { avatarKey: key }); }
    catch (error) { await discardPhoto(key); throw error; }
    await discardPhoto(result.previousAvatarKey);
    return withAvatar(result.profile);
  }

  async removeAvatar(userId: number, sessionId: number) {
    const result = await profileRepository.update(userId, sessionId, { avatarKey: null });
    await discardPhoto(result.previousAvatarKey);
    return withAvatar(result.profile);
  }
}

export default new ProfileService();
