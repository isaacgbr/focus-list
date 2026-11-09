import type { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";

const select = { name: true, email: true, createdAt: true, avatarKey: true, defaultView: true } as const;
type ProfileChanges = { name?: string; email?: string; defaultView?: string; avatarKey?: string | null };

async function lockAccount(tx: Prisma.TransactionClient, userId: number, sessionId: number, expectedHash?: string) {
  // Mesmo lock do login/recuperação, com revalidação da sessão dentro da transação.
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  const user = await tx.user.findUnique({ where: { id: userId }, select: { type: true, passwordHash: true, avatarKey: true, email: true } });
  if (user?.type !== "REAL") throw new HttpError(403, "Perfil disponível apenas para contas FocusList.");
  const session = await tx.session.findFirst({ where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!session) throw new HttpError(401, "Autenticação necessária.");
  if (expectedHash !== undefined && user.passwordHash !== expectedHash) throw new HttpError(409, "Os dados de segurança mudaram. Tente novamente.");
  return user;
}

class ProfileRepository {
  find(userId: number) {
    return prisma.user.findFirstOrThrow({ where: { id: userId, type: "REAL" }, select });
  }

  findCredentials(userId: number) {
    return prisma.user.findFirst({ where: { id: userId, type: "REAL" }, select: { passwordHash: true } });
  }

  update(userId: number, sessionId: number, data: ProfileChanges, expectedHash?: string) {
    return prisma.$transaction(async (tx) => {
      const previous = await lockAccount(tx, userId, sessionId, expectedHash);
      const profile = await tx.user.update({ where: { id: userId }, data, select });
      if (data.email !== undefined && data.email !== previous.email) {
        // Um link enviado ao endereço anterior não deve recuperar a conta após a troca.
        await tx.passwordReset.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
      }
      return { profile, previousAvatarKey: previous.avatarKey };
    });
  }

  changePassword(userId: number, sessionId: number, expectedHash: string, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      await lockAccount(tx, userId, sessionId, expectedHash);
      const now = new Date();
      await tx.user.update({ where: { id: userId }, data: { passwordHash }, select: { id: true } });
      await tx.session.updateMany({ where: { userId, id: { not: sessionId }, revokedAt: null }, data: { revokedAt: now } });
      await tx.passwordReset.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
    });
  }
}

export default new ProfileRepository();
