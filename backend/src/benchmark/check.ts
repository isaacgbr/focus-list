import { guardBenchmarkDatabase } from "./config.js";

try {
  const config = await guardBenchmarkDatabase();
  console.log(`Proteção validada para o banco isolado: ${config.database}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
