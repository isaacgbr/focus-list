-- Proposta gerada offline a partir dos schemas anterior e atual; não aplicada ao banco.
-- Sem backfill: as Areas existentes permanecem com userId NULL.
-- Os CHECKs abaixo complementam regras que o schema Prisma não representa.
BEGIN;

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('REAL', 'DEMO');

-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "type" "UserType" NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_type_expiresAt_idx" ON "User"("type", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Area_userId_idx" ON "Area"("userId");

-- CreateIndex
CREATE INDEX "List_areaId_idx" ON "List"("areaId");

-- CreateIndex
CREATE INDEX "Task_listId_idx" ON "Task"("listId");

-- CreateIndex
CREATE INDEX "ChecklistItem_taskId_idx" ON "ChecklistItem"("taskId");

-- CreateIndex
CREATE INDEX "Link_taskId_idx" ON "Link"("taskId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- REAL exige credenciais; DEMO não possui credenciais e vence 24h após sua criação.
-- IS NOT NULL é explícito porque CHECK também aceita expressões que resultam em NULL.
ALTER TABLE "User" ADD CONSTRAINT "User_type_fields_check" CHECK (
    (
        "type" = 'REAL'
        AND "name" IS NOT NULL AND btrim("name") <> ''
        AND "email" IS NOT NULL
        AND "passwordHash" IS NOT NULL AND btrim("passwordHash") <> ''
        AND "expiresAt" IS NULL
    )
    OR
    (
        "type" = 'DEMO'
        AND "email" IS NULL
        AND "passwordHash" IS NULL
        AND "expiresAt" IS NOT NULL
        AND "expiresAt" = "createdAt" + INTERVAL '24 hours'
    )
);

-- A futura autenticação deve normalizar antes de persistir; o banco rejeita divergências.
-- UNIQUE permite múltiplos NULL (DEMO), mas impede e-mails REAL normalizados repetidos.
ALTER TABLE "User" ADD CONSTRAINT "User_email_normalized_check" CHECK (
    "email" IS NULL OR (
        "email" <> ''
        AND "email" = lower(btrim("email"))
        AND "email" !~ '[[:space:]]'
    )
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_tokenHash_format_check" CHECK (
    "tokenHash" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_expiration_check" CHECK (
    "expiresAt" > "createdAt"
);

COMMIT;
