import "dotenv/config";
import demoRepository from "../repositories/demo.repository.js";
import { disconnectDatabase } from "../config/prisma.js";

// Manutenção explícita, sem scheduler, endpoint público ou dependências adicionais.
try {
  const result = await demoRepository.cleanupExpired();
  console.log(`Demonstrações expiradas removidas: ${result.count}. Lote máximo: 50.`);
} catch {
  console.error("Não foi possível limpar as demonstrações expiradas. Nenhuma remoção parcial foi confirmada.");
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
