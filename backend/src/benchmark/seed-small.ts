import { pathToFileURL } from "node:url";

import { BENCHMARK_PROFILES } from "./profiles.js";
import { seedBenchmark } from "./seed.js";

export async function seedSmallBenchmark() {
  return seedBenchmark(BENCHMARK_PROFILES.small);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSmallBenchmark().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
