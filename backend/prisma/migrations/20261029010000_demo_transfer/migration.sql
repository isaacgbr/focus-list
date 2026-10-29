-- Preflight local: migrations anteriores aplicadas; nenhuma Demo e nenhuma Área órfã.
-- Migration exclusivamente aditiva: não modifica User, Session, Area ou dados existentes.
BEGIN;
CREATE TABLE "DemoTransfer" (
    "id" SERIAL NOT NULL,
    "demoUserId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "DemoTransfer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DemoTransfer_demoUserId_key" ON "DemoTransfer"("demoUserId");
CREATE UNIQUE INDEX "DemoTransfer_sessionId_key" ON "DemoTransfer"("sessionId");
ALTER TABLE "DemoTransfer" ADD CONSTRAINT "DemoTransfer_demoUserId_fkey"
    FOREIGN KEY ("demoUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemoTransfer" ADD CONSTRAINT "DemoTransfer_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
