import prisma from "../config/prisma.js";

export const publicUserSelect = { id: true, name: true, email: true, createdAt: true } as const;

class AuthRepository {
  createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data: { ...data, type: "REAL" }, select: publicUserSelect });
  }

  findAccount(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { ...publicUserSelect, passwordHash: true, type: true } });
  }

  async createSession(userId: number, hash: string, expiresAt: Date, previousHash?: string) {
    await prisma.$transaction(async (tx) => {
      if (previousHash) await tx.session.updateMany({ where: { tokenHash: previousHash, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.session.create({ data: { userId, tokenHash: hash, expiresAt } });
    });
  }

  findValidSession(hash: string) {
    return prisma.session.findFirst({
      where: { tokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() }, user: { type: "REAL" } },
      select: { id: true, userId: true },
    });
  }

  findPublicUser(userId: number) {
    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
  }

  revokeSession(sessionId: number, userId: number) {
    return prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}

export default new AuthRepository();
