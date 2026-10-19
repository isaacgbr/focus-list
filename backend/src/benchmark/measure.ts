import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { guardBenchmarkDatabase } from "./config.js";
import { expectedCounts, getBenchmarkProfile } from "./profiles.js";

const WARMUP_RUNS = 3;
const MEASURED_RUNS = 20;

type Sample = {
  milliseconds: number;
  bytes: number;
  status: number;
  ok: boolean;
};

type EndpointDefinition = {
  key: string;
  path: string;
};

function percentile(sorted: number[], fraction: number) {
  const index = Math.ceil(fraction * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function summarize(samples: Sample[]) {
  const times = samples.map((sample) => sample.milliseconds).sort((a, b) => a - b);
  const bytes = samples.map((sample) => sample.bytes);
  const round = (value: number) => Math.round(value * 100) / 100;

  return {
    requests: samples.length,
    errors: samples.filter((sample) => !sample.ok).length,
    statusCodes: [...new Set(samples.map((sample) => sample.status))],
    meanMs: round(times.reduce((total, value) => total + value, 0) / times.length),
    medianMs: round(percentile(times, 0.5)),
    p95Ms: round(percentile(times, 0.95)),
    minMs: round(times[0]),
    maxMs: round(times[times.length - 1]),
    payloadBytes: bytes[0],
    payloadBytesStable: bytes.every((value) => value === bytes[0]),
  };
}

async function request(baseUrl: string, endpoint: EndpointDefinition): Promise<Sample> {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${endpoint.path}`);
  const body = await response.arrayBuffer();
  return {
    milliseconds: performance.now() - startedAt,
    bytes: body.byteLength,
    status: response.status,
    ok: response.ok,
  };
}

let server: Server | undefined;
let prisma: PrismaClient | undefined;

try {
  const profile = getBenchmarkProfile(process.argv[2]);
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
    throw new Error(
      `O banco não contém o perfil ${profile.name}: ${JSON.stringify(actual)}.`,
    );
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

  const endpoints: EndpointDefinition[] = [
    { key: "areas", path: "/areas" },
    { key: "lists", path: "/lists" },
    { key: "tasks", path: "/tasks" },
    { key: "checklistItems", path: "/checklist-items" },
    { key: "links", path: "/links" },
    { key: "areaDetail", path: "/areas/1" },
    { key: "listDetail", path: "/lists/1" },
    { key: "taskDetail", path: "/tasks/1" },
    { key: "archived", path: "/archived" },
  ];
  const samples = Object.fromEntries(
    endpoints.map((endpoint) => [endpoint.key, [] as Sample[]]),
  );

  for (const endpoint of endpoints) {
    for (let run = 0; run < WARMUP_RUNS; run += 1) {
      const warmup = await request(baseUrl, endpoint);
      if (!warmup.ok) {
        throw new Error(`${endpoint.path} respondeu HTTP ${warmup.status} no aquecimento.`);
      }
    }
  }

  // Uma única requisição é aguardada por vez. A rotação reduz viés de ordem
  // sem introduzir usuários ou requisições concorrentes.
  for (let run = 0; run < MEASURED_RUNS; run += 1) {
    for (let offset = 0; offset < endpoints.length; offset += 1) {
      const endpoint = endpoints[(run + offset) % endpoints.length];
      samples[endpoint.key].push(await request(baseUrl, endpoint));
    }
  }

  const endpointResults = Object.fromEntries(endpoints.map((endpoint) => [
    endpoint.key,
    { path: endpoint.path, ...summarize(samples[endpoint.key]) },
  ]));

  const pageDefinitions: Record<string, Record<string, number>> = {
    dashboard: { areas: 2, lists: 1, tasks: 1, checklistItems: 1, links: 1 },
    area: { areas: 1, areaDetail: 1, lists: 1, tasks: 1 },
    list: {
      areas: 1,
      areaDetail: 1,
      listDetail: 1,
      tasks: 1,
      checklistItems: 1,
      links: 1,
    },
    taskDetailsIncremental: { checklistItems: 1, links: 1 },
    archive: { areas: 1, archived: 1 },
  };
  const pages = Object.fromEntries(Object.entries(pageDefinitions).map(([page, members]) => {
    const entries = Object.entries(members).map(([key, multiplicity]) => ({
      key,
      multiplicity,
      result: endpointResults[key],
    }));
    return [page, {
      endpoints: members,
      payloadBytes: entries.reduce(
        (total, entry) => total + entry.result.payloadBytes * entry.multiplicity,
        0,
      ),
      sequentialMedianSumMs: Math.round(entries.reduce(
        (total, entry) => total + entry.result.medianMs * entry.multiplicity,
        0,
      ) * 100) / 100,
      slowestEndpointByMedian: entries.reduce((slowest, entry) =>
        entry.result.medianMs > slowest.result.medianMs ? entry : slowest).key,
      slowestEndpointMedianMs: Math.max(...entries.map((entry) => entry.result.medianMs)),
    }];
  }));

  const errors = Object.entries(endpointResults)
    .filter(([, result]) => result.errors > 0)
    .map(([key, result]) => ({ key, errors: result.errors, statusCodes: result.statusCodes }));
  const report = {
    stage: "21B.2",
    measuredAt: new Date().toISOString(),
    database: config.database,
    profile: profile.name,
    label: profile.label,
    dataset: actual,
    method: {
      warmupRuns: WARMUP_RUNS,
      measuredRuns: MEASURED_RUNS,
      requestConcurrency: 1,
      payloadMeasurement: "response body bytes",
      pageValues: "derived from measured API endpoints used by the frontend",
    },
    endpoints: endpointResults,
    pages,
    errors,
  };

  const outputPath = resolve(
    process.cwd(),
    "..",
    "docs",
    "benchmark-results",
    `21b2-${profile.name}.json`,
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
