import prisma from "../config/prisma.js";
import { publicUserSelect } from "./auth.repository.js";
import { HttpError } from "../utils/http-error.js";

export const DEMO_DURATION = 24 * 60 * 60 * 1000;
const sessionUserSelect = { ...publicUserSelect, type: true, expiresAt: true } as const;
const realSessionActive = () => new HttpError(409, "Você já possui uma sessão ativa. Volte ao FocusList para continuar.");

class DemoRepository {
  async cleanupExpired() {
    return prisma.$transaction(async (tx) => {
      // Lote limitado e bloqueado; não espera por identidades sendo usadas por outra operação.
      const expired = await tx.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "User"
        WHERE "type" = 'DEMO' AND "expiresAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        ORDER BY "expiresAt", "id" LIMIT 50 FOR UPDATE SKIP LOCKED`;
      const ids = expired.map(({ id }) => id);
      const where = { id: { in: ids }, type: "DEMO" as const, expiresAt: { lte: new Date() } };
      // Area → List → Task → ChecklistItem/Link já possui cascatas no schema real.
      await tx.area.deleteMany({ where: { userId: { in: ids }, user: where } });
      return tx.user.deleteMany({ where });
    });
  }

  async start(previousHash: string | undefined, hash: string) {
    return prisma.$transaction(async (tx) => {
      const previous = previousHash ? await tx.session.findUnique({ where: { tokenHash: previousHash } }) : null;
      if (previous) {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${previous.userId} FOR UPDATE`;
        const now = new Date();
        const current = await tx.session.findFirst({
          where: { id: previous.id, revokedAt: null, expiresAt: { gt: now } },
          include: { user: { select: sessionUserSelect } },
        });
        if (current?.user.type === "REAL") throw realSessionActive();
        if (current && current.user.expiresAt && current.user.expiresAt > now) {
          return { user: current.user, expiresAt: current.expiresAt, reused: true };
        }
      }
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + DEMO_DURATION);
      const user = await tx.user.create({
        data: { type: "DEMO", createdAt, expiresAt, sessions: { create: { tokenHash: hash, expiresAt, createdAt } } },
        select: sessionUserSelect,
      });
      return { user, expiresAt, reused: false };
    });
  }

  async register(data: { name: string; email: string; passwordHash: string }, previousHash: string | undefined, hash: string, expiresAt: Date) {
    return prisma.$transaction(async (tx) => {
      const previous = previousHash ? await tx.session.findUnique({ where: { tokenHash: previousHash } }) : null;
      if (previous) await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${previous.userId} FOR UPDATE`;
      const now = new Date();
      const current = previous ? await tx.session.findFirst({
        where: { id: previous.id, revokedAt: null, expiresAt: { gt: now } }, include: { user: true },
      }) : null;
      if (current?.user.type === "REAL") throw realSessionActive();
      const source = current?.user.type === "DEMO" && current.user.expiresAt && current.user.expiresAt > now ? current.user : null;
      // Conta, sessão REAL, vínculo e revogação da Demo são uma única operação.
      const user = await tx.user.create({ data: { ...data, type: "REAL" }, select: sessionUserSelect });
      const session = await tx.session.create({ data: { userId: user.id, tokenHash: hash, expiresAt } });
      if (source) {
        await tx.demoTransfer.create({ data: { demoUserId: source.id, sessionId: session.id } });
        await tx.session.updateMany({ where: { userId: source.id, revokedAt: null }, data: { revokedAt: now } });
      }
      return { ...user, demoImport: source ? "pending" as const : "unavailable" as const };
    });
  }

  async status(sessionId: number) {
    const transfer = await prisma.demoTransfer.findUnique({ where: { sessionId }, include: { demoUser: true } });
    if (!transfer || transfer.resolvedAt) return null;
    return transfer.demoUser.type === "DEMO" && transfer.demoUser.expiresAt && transfer.demoUser.expiresAt > new Date() ? "pending" : "unavailable";
  }

  async resolve(sessionId: number, userId: number, action: "import" | "discard") {
    return prisma.$transaction(async (tx) => {
      // O contexto é selecionado pela sessão autenticada, nunca por IDs fornecidos no corpo.
      await tx.$queryRaw`SELECT "id" FROM "Session" WHERE "id" = ${sessionId} FOR UPDATE`;
      const now = new Date();
      const session = await tx.session.findFirst({
        where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: now }, user: { type: "REAL" } },
      });
      if (!session) throw new HttpError(401, "Autenticação necessária.");
      const transfer = await tx.demoTransfer.findUnique({ where: { sessionId } });
      if (!transfer || transfer.resolvedAt) throw new HttpError(409, "Os dados da demonstração não estão disponíveis ou esta escolha já foi concluída.");
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${transfer.demoUserId} FOR UPDATE`;
      const source = await tx.user.findUnique({ where: { id: transfer.demoUserId } });
      if (action === "import" && (source?.type !== "DEMO" || !source.expiresAt || source.expiresAt <= new Date())) {
        throw new HttpError(410, "A demonstração terminou. Sua conta foi criada e você pode começar do zero.");
      }
      if (action === "import") {
        // Uma mudança nas raízes preserva IDs e todos os atributos dos descendentes.
        await tx.area.updateMany({ where: { userId: transfer.demoUserId, user: { type: "DEMO" } }, data: { userId } });
      }
      await tx.session.updateMany({ where: { userId: transfer.demoUserId, revokedAt: null }, data: { revokedAt: now } });
      await tx.demoTransfer.update({ where: { id: transfer.id }, data: { resolvedAt: now } });
    });
  }

  async exit(sessionId: number, userId: number) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      const session = await tx.session.findFirst({ where: { id: sessionId, userId, revokedAt: null, user: { type: "DEMO" } } });
      if (!session) throw new HttpError(409, "Esta sessão não é uma demonstração ativa.");
      await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
  }
}

export default new DemoRepository();
