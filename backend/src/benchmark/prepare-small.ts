import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { guardBenchmarkDatabase } from "./config.js";
import { seedSmallBenchmark } from "./seed-small.js";

try {
  const config = await guardBenchmarkDatabase();
  const prismaPackage = createRequire(import.meta.url).resolve("prisma/package.json");
  const prismaCli = join(dirname(prismaPackage), "build", "index.js");
  const migration = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: config.benchmarkUrl },
    encoding: "utf8",
    stdio: "inherit",
  });

  if (migration.error) throw migration.error;
  if (migration.status !== 0) {
    throw new Error(`Falha ao aplicar migrations (código ${migration.status}).`);
  }

  await seedSmallBenchmark();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
