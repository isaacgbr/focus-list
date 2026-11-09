import prisma from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";

export const publicUserSelect = { id: true, name: true, email: true, createdAt: true } as const;
const sessionUserSelect = { ...publicUserSelect, avatarKey: true, defaultView: true } as const;

class AuthRepository {
  createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data: { ...data, type: "REAL" }, select: publicUserSelect });
  }

  findAccount(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { ...sessionUserSelect, passwordHash: true, type: true } });
  }

  async createSession(userId: number, hash: string, expiresAt: Date, previousHash?: string, expectedPasswordHash?: string) {
    await prisma.$transaction(async (tx) => {
      // Serializa login e redefinição: uma senha verificada antes da troca não cria sessão depois dela.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      if (expectedPasswordHash) {
        const account = await tx.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
        if (account?.passwordHash !== expectedPasswordHash) throw new HttpError(401, "E-mail ou senha inválidos.");
      }
      if (previousHash) await tx.session.updateMany({ where: { tokenHash: previousHash, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.session.create({ data: { userId, tokenHash: hash, expiresAt } });
    });
  }

  async createPasswordReset(userId: number, hash: string, email: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      // Uma consulta anterior à troca de e-mail não pode emitir um novo link para o endereço antigo.
      const account = await tx.user.findUnique({ where: { id: userId }, select: { email: true, type: true } });
      if (account?.type !== "REAL" || account.email !== email) return false;
      const now = new Date();
      const previous = await tx.passwordReset.findUnique({ where: { userId } });
      if (previous && now.getTime() - previous.createdAt.getTime() < 60_000) return false;
      const data = { tokenHash: hash, expiresAt: new Date(now.getTime() + 30 * 60_000), usedAt: null, createdAt: now };
      await tx.passwordReset.upsert({ where: { userId }, create: { userId, ...data }, update: data });
      return true;
    });
  }

  findPasswordReset(hash: string) {
    return prisma.passwordReset.findFirst({
      where: { tokenHash: hash, usedAt: null, expiresAt: { gt: new Date() }, user: { type: "REAL" } },
      select: { userId: true },
    });
  }

  async resetPassword(userId: number, hash: string, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const now = new Date();
      // Revalida e consome dentro da mesma transação da senha e das sessões.
      const consumed = await tx.passwordReset.updateMany({
        where: { userId, tokenHash: hash, usedAt: null, expiresAt: { gt: now }, user: { type: "REAL" } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
      return true;
    });
  }

  findValidSession(hash: string) {
    return prisma.session.findFirst({
      where: { tokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() }, user: {
        OR: [{ type: "REAL" }, { type: "DEMO", expiresAt: { gt: new Date() } }],
      } },
      select: { id: true, userId: true, user: { select: { type: true } } },
    });
  }

  findPublicUser(userId: number) {
    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ...sessionUserSelect, type: true, expiresAt: true } });
  }

  revokeSession(sessionId: number, userId: number) {
    return prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

export default new AuthRepository();
