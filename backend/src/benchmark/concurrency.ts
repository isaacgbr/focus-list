import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { guardBenchmarkDatabase } from "./config.js";
import { BENCHMARK_PROFILES, expectedCounts } from "./profiles.js";

const CONCURRENCY_LEVELS = [1, 5, 10, 25, 50] as const;
const MINIMUM_LOGICAL_SAMPLES = 20;
const REQUEST_TIMEOUT_MS = 30_000;
const ABSOLUTE_SEVERE_P95_MS = 10_000;
const RELATIVE_SEVERE_P95_FACTOR = 10;
const SEVERE_THROUGHPUT_RETENTION = 0.75;

type RequestSample = {
  milliseconds: number;
  bytes: number;
  status: number | null;
  ok: boolean;
  timeout: boolean;
  error?: string;
};

type LogicalSample = {
  milliseconds: number;
};

type Scenario = {
  key: string;
  label: string;
  paths: string[];
};

type Summary = {
  concurrency: number;
  logicalSamples: number;
  httpRequests: number;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  requestsPerSecond: number;
  errors: number;
  timeouts: number;
  statusCodes: number[];
  payloadBytes: number;
  degradationVsConcurrency1: {
    meanFactor: number;
    medianFactor: number;
    p95Factor: number;
    throughputFactor: number;
  };
};

const scenarios: Scenario[] = [
  { key: "checklistItems", label: "GET /checklist-items", paths: ["/checklist-items"] },
  { key: "tasks", label: "GET /tasks", paths: ["/tasks"] },
  { key: "links", label: "GET /links", paths: ["/links"] },
  {
    key: "dashboard",
    label: "Dashboard + Sidebar",
    paths: ["/areas", "/areas", "/lists", "/tasks", "/checklist-items", "/links"],
  },
];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function percentile(sorted: number[], fraction: number) {
  const index = Math.ceil(fraction * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function request(baseUrl: string, path: string): Promise<RequestSample> {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.arrayBuffer();
    return {
      milliseconds: performance.now() - startedAt,
      bytes: body.byteLength,
      status: response.status,
      ok: response.ok,
      timeout: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      milliseconds: performance.now() - startedAt,
      bytes: 0,
      status: null,
      ok: false,
      timeout: /timeout|aborted/i.test(message),
      error: message,
    };
  }
}

async function runScenario(
  baseUrl: string,
  scenario: Scenario,
  concurrency: number,
  baseline?: Summary,
): Promise<Summary> {
  const rounds = Math.max(1, Math.ceil(MINIMUM_LOGICAL_SAMPLES / concurrency));
  const logicalSamples: LogicalSample[] = [];
  const requestSamples: RequestSample[] = [];
  let totalWallMilliseconds = 0;

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    const batchStartedAt = performance.now();
    const flows = Array.from({ length: concurrency }, async () => {
      const flowStartedAt = performance.now();
      const samples = await Promise.all(
        scenario.paths.map((path) => request(baseUrl, path)),
      );
      requestSamples.push(...samples);
      logicalSamples.push({ milliseconds: performance.now() - flowStartedAt });
    });
    await Promise.all(flows);
    totalWallMilliseconds += performance.now() - batchStartedAt;
  }

  const times = logicalSamples
    .map((sample) => sample.milliseconds)
    .sort((first, second) => first - second);
  const meanMs = times.reduce((total, value) => total + value, 0) / times.length;
  const medianMs = percentile(times, 0.5);
  const p95Ms = percentile(times, 0.95);
  const requestsPerSecond = requestSamples.length / (totalWallMilliseconds / 1_000);

  return {
    concurrency,
    logicalSamples: logicalSamples.length,
    httpRequests: requestSamples.length,
    meanMs: round(meanMs),
    medianMs: round(medianMs),
    p95Ms: round(p95Ms),
    requestsPerSecond: round(requestsPerSecond),
    errors: requestSamples.filter((sample) => !sample.ok).length,
    timeouts: requestSamples.filter((sample) => sample.timeout).length,
    statusCodes: [...new Set(requestSamples.flatMap((sample) =>
      sample.status === null ? [] : [sample.status]))].sort((first, second) => first - second),
    payloadBytes: requestSamples.reduce((total, sample) => total + sample.bytes, 0),
    degradationVsConcurrency1: {
      meanFactor: round(baseline ? meanMs / baseline.meanMs : 1),
      medianFactor: round(baseline ? medianMs / baseline.medianMs : 1),
      p95Factor: round(baseline ? p95Ms / baseline.p95Ms : 1),
      throughputFactor: round(baseline ? requestsPerSecond / baseline.requestsPerSecond : 1),
    },
  };
}

function severeReason(current: Summary, previous: Summary | undefined, baseline: Summary) {
  if (current.errors > 0) {
    return `${current.errors} erro(s), incluindo ${current.timeouts} timeout(s)`;
  }
  if (current.p95Ms >= ABSOLUTE_SEVERE_P95_MS) {
    return `p95 de ${current.p95Ms} ms atingiu o limite de ${ABSOLUTE_SEVERE_P95_MS} ms`;
  }
  if (previous
    && current.p95Ms >= baseline.p95Ms * RELATIVE_SEVERE_P95_FACTOR
    && current.requestsPerSecond <= previous.requestsPerSecond * SEVERE_THROUGHPUT_RETENTION) {
    return `p95 chegou a ${round(current.p95Ms / baseline.p95Ms)}x o nível 1 e req/s caiu para ${round(current.requestsPerSecond / previous.requestsPerSecond)}x o nível anterior`;
  }
  return undefined;
}

let server: Server | undefined;
let prisma: PrismaClient | undefined;

try {
  const profile = BENCHMARK_PROFILES.large;
  const expected = expectedCounts(profile);
  const config = await guardBenchmarkDatabase();
  process.env.DATABASE_URL = config.benchmarkUrl;

  const [{ default: app }, prismaModule] = await Promise.all([
    import("../app.js"),
    import("../config/prisma.js"),
  ]);
  prisma = prismaModule.default;

  const [areas, lists, tasks, checklistItems, links] = await Promise.all([
    prisma.area.count(),
    prisma.list.count(),
    prisma.task.count(),
    prisma.checklistItem.count(),
    prisma.link.count(),
  ]);
  const actual = { areas, lists, tasks, checklistItems, links };
  if (Object.entries(expected).some(([key, value]) =>
    actual[key as keyof typeof actual] !== value)) {
    throw new Error(`O banco não contém o perfil Grande: ${JSON.stringify(actual)}.`);
  }

  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolveListening, reject) => {
    server?.once("listening", resolveListening);
    server?.once("error", reject);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("A API não abriu uma porta local.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  for (const scenario of scenarios) {
    const warmups = await Promise.all(scenario.paths.map((path) => request(baseUrl, path)));
    const failure = warmups.find((sample) => !sample.ok);
    if (failure) {
      throw new Error(`${scenario.label} falhou no aquecimento: ${failure.error ?? failure.status}.`);
    }
  }

  const results: Record<string, Summary[]> = Object.fromEntries(
    scenarios.map((scenario) => [scenario.key, []]),
  );
  let interrupted: { concurrency: number; scenario: string; reason: string } | null = null;

  for (const concurrency of CONCURRENCY_LEVELS) {
    console.error(`Executando concorrência ${concurrency}...`);
    for (const scenario of scenarios) {
      const history = results[scenario.key];
      const summary = await runScenario(
        baseUrl,
        scenario,
        concurrency,
        history[0],
      );
      history.push(summary);
      console.error(`${scenario.label}: p95=${summary.p95Ms}ms req/s=${summary.requestsPerSecond} erros=${summary.errors}`);

      const reason = severeReason(summary, history.at(-2), history[0]);
      if (reason) {
        interrupted = { concurrency, scenario: scenario.label, reason };
        break;
      }
    }
    if (interrupted) break;
  }

  const report = {
    stage: "21B.3",
    measuredAt: new Date().toISOString(),
    database: config.database,
    profile: profile.name,
    label: profile.label,
    dataset: actual,
    method: {
      concurrencyLevels: CONCURRENCY_LEVELS,
      minimumLogicalSamplesPerScenarioAndLevel: MINIMUM_LOGICAL_SAMPLES,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      dashboardPathsPerFlow: scenarios.find((scenario) => scenario.key === "dashboard")?.paths,
      dashboardLatency: "tempo do fluxo completo; req/s e erros contam requisicoes HTTP",
      interruptionCriteria: {
        anyErrorOrTimeout: true,
        absoluteP95Ms: ABSOLUTE_SEVERE_P95_MS,
        relativeP95Factor: RELATIVE_SEVERE_P95_FACTOR,
        throughputRetentionVsPreviousLevel: SEVERE_THROUGHPUT_RETENTION,
      },
    },
    results,
    interrupted,
  };

  const outputPath = resolve(
    process.cwd(),
    "..",
    "docs",
    "benchmark-results",
    "21b3-concurrency-large.json",
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
} finally {
  if (server) await new Promise<void>((resolveClose) => server?.close(() => resolveClose()));
  await prisma?.$disconnect();
}
