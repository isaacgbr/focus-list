import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Cria a conexão com o PostgreSQL utilizando a DATABASE_URL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
