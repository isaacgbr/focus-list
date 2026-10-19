import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "dotenv";
import { Pool } from "pg";

const CONFIRMATION = "FOCUSLIST_BENCHMARK_ONLY";
const BENCHMARK_ENV_FILE = resolve(process.cwd(), ".env.benchmark.local");
const DEVELOPMENT_ENV_FILE = resolve(process.cwd(), ".env");

type DatabaseTarget = {
  database: string;
};

export type BenchmarkConfig = {
  benchmarkUrl: string;
  database: string;
};

function readEnvFile(path: string) {
  return existsSync(path) ? parse(readFileSync(path)) : {};
}

function parseDatabaseTarget(value: string, variableName: string): DatabaseTarget {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} não contém uma URL válida.`);
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error(`${variableName} deve usar PostgreSQL.`);
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database || database.includes("/")) {
    throw new Error(`${variableName} deve identificar exatamente um banco.`);
  }

  return { database };
}

function sameDatabase(first: DatabaseTarget, second: DatabaseTarget) {
  // A igualdade de nomes é bloqueada mesmo entre servidores. É uma decisão
  // conservadora: benchmark e desenvolvimento devem ter identidades inequívocas.
  return first.database.toLowerCase() === second.database.toLowerCase();
}

export function loadBenchmarkConfig(): BenchmarkConfig {
  const benchmarkFile = readEnvFile(BENCHMARK_ENV_FILE);
  const developmentFile = readEnvFile(DEVELOPMENT_ENV_FILE);
  const benchmarkUrl = process.env.BENCHMARK_DATABASE_URL
    ?? benchmarkFile.BENCHMARK_DATABASE_URL;
  const confirmation = process.env.BENCHMARK_CONFIRMATION
    ?? benchmarkFile.BENCHMARK_CONFIRMATION;

  if (!benchmarkUrl) {
    throw new Error(
      "BENCHMARK_DATABASE_URL é obrigatória; DATABASE_URL nunca é usada como fallback.",
    );
  }

  if (confirmation !== CONFIRMATION) {
    throw new Error(
      `BENCHMARK_CONFIRMATION deve ser exatamente ${CONFIRMATION}.`,
    );
  }

  const benchmark = parseDatabaseTarget(
    benchmarkUrl,
    "BENCHMARK_DATABASE_URL",
  );

  if (!benchmark.database.toLowerCase().endsWith("_benchmark")) {
    throw new Error("O nome do banco de benchmark deve terminar em _benchmark.");
  }

  const developmentUrl = developmentFile.DATABASE_URL
    ?? process.env.DEVELOPMENT_DATABASE_URL
    ?? process.env.DATABASE_URL;

  if (developmentUrl) {
    const development = parseDatabaseTarget(developmentUrl, "DATABASE_URL");
    if (sameDatabase(benchmark, development)) {
      throw new Error(
        "Bloqueado: o banco de benchmark coincide com o banco de desenvolvimento.",
      );
    }
  }

  return { benchmarkUrl, database: benchmark.database };
}

export async function assertBenchmarkDatabase(config: BenchmarkConfig) {
  const pool = new Pool({
    connectionString: config.benchmarkUrl,
    max: 1,
    application_name: "focuslist-benchmark-guard",
  });

  try {
    const result = await pool.query<{ database: string }>(
      "SELECT current_database() AS database",
    );
    const actualDatabase = result.rows[0]?.database;

    if (!actualDatabase || actualDatabase !== config.database) {
      throw new Error(
        "O banco conectado não corresponde ao nome informado na URL de benchmark.",
      );
    }

    if (!actualDatabase.toLowerCase().endsWith("_benchmark")) {
      throw new Error("A conexão não aponta para um banco terminado em _benchmark.");
    }
  } finally {
    await pool.end();
  }
}

export async function guardBenchmarkDatabase() {
  const config = loadBenchmarkConfig();
  await assertBenchmarkDatabase(config);
  return config;
}
