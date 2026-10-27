import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import authRepository from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import { SESSION_DURATION, tokenHash } from "../security/session.js";
import { HttpError } from "../utils/http-error.js";
import { allowedBody } from "../utils/validation.js";

function credentials(body: Record<string, unknown>) {
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    throw new HttpError(400, "E-mail e senha são obrigatórios.");
  }
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) {
    throw new HttpError(400, "E-mail inválido.");
  }
  const password = body.password;
  if ([...password].length < 8 || [...password].length > 32 || Buffer.byteLength(password) > 128) {
    throw new HttpError(400, "A senha deve ter entre 8 e 32 caracteres.");
  }
  return { email, password };
}

class AuthService {
  session(userId: number) {
    return authRepository.findPublicUser(userId);
  }

  logout(sessionId: number, userId: number) {
    return authRepository.revokeSession(sessionId, userId);
  }

  async register(value: unknown) {
    const body = allowedBody(value, ["name", "email", "password", "confirmPassword"]);
    const { email, password } = credentials(body);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || [...name].length > 100 || /[\u0000-\u001f\u007f]/.test(name)) throw new HttpError(400, "Nome inválido (1 a 100 caracteres).");
    if (body.confirmPassword !== password) throw new HttpError(400, "A confirmação da senha não confere.");
    // Calcula também no caminho duplicado para reduzir diferença de tempo.
    const passwordHash = await hashPassword(password);
    try {
      return await authRepository.createUser({ name, email, passwordHash });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(400, "Não foi possível criar a conta com os dados informados.");
      }
      throw error;
    }
  }

  async login(value: unknown, previousToken?: string) {
    const { email, password } = credentials(allowedBody(value, ["email", "password"]));
    const account = await authRepository.findAccount(email);
    const valid = await verifyPassword(password, account?.passwordHash);
    if (!valid || !account || account.type !== "REAL") throw new HttpError(401, "E-mail ou senha inválidos.");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    await authRepository.createSession(account.id, tokenHash(token), expiresAt, previousToken ? tokenHash(previousToken) : undefined);
    const { passwordHash: _hash, type: _type, ...user } = account;
    return { user, token, expiresAt };
  }
}

export default new AuthService();
