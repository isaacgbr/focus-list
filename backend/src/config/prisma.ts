import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Cada instância Fluid Compute reutiliza este pool entre requisições.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.VERCEL === "1" && {
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
  }),
});

const adapter = new PrismaPg(pool);

// Cliente Prisma utilizado por toda a aplicação.
const prisma = new PrismaClient({
  adapter,
});

export default prisma;

export async function disconnectDatabase() {
  await prisma.$disconnect();
  await pool.end();
}
