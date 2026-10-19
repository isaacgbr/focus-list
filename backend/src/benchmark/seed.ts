import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";
import { Pool } from "pg";

import { guardBenchmarkDatabase } from "./config.js";
import {
  expectedCounts,
  getBenchmarkProfile,
  type BenchmarkProfile,
} from "./profiles.js";

const BASE_TIME = Date.UTC(2026, 0, 1, 12, 0, 0);
const COLORS = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#475569"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const BATCH_SIZE = 1_000;

async function createInBatches<T>(
  values: T[],
  createMany: (batch: T[]) => Promise<unknown>,
) {
  for (let offset = 0; offset < values.length; offset += BATCH_SIZE) {
    await createMany(values.slice(offset, offset + BATCH_SIZE));
  }
}

export async function seedBenchmark(profile: BenchmarkProfile) {
  const config = await guardBenchmarkDatabase();
  process.env.DATABASE_URL = config.benchmarkUrl;

  const pool = new Pool({
    connectionString: config.benchmarkUrl,
    application_name: `focuslist-benchmark-seed-${profile.name}`,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const expected = expectedCounts(profile);

  try {
    await prisma.$transaction(async (transaction) => {
      // A limpeza integral só ocorre após guardBenchmarkDatabase validar URL,
      // confirmação, isolamento do desenvolvimento e current_database().
      await transaction.$executeRaw`
        TRUNCATE TABLE "ChecklistItem", "Link", "Task", "List", "Area"
        RESTART IDENTITY CASCADE
      `;

      const archivedAreaId = profile.areas;
      const directArchivedListId = (profile.areas - 1) * profile.listsPerArea;
      const directArchivedTaskId =
        (directArchivedListId - 1) * profile.tasksPerList;

      const areas = Array.from({ length: expected.areas }, (_, index) => {
        const id = index + 1;
        const timestamp = new Date(BASE_TIME + id * 86_400_000);
        return {
          id,
          title: `${profile.prefix} Área ${String(id).padStart(2, "0")}`,
          description: `${profile.prefix} dados sintéticos determinísticos`,
          color: COLORS[index % COLORS.length],
          icon: "Folder",
          createdAt: timestamp,
          updatedAt: timestamp,
          archivedAt: id === archivedAreaId
            ? new Date(BASE_TIME + 90 * 86_400_000)
            : null,
        };
      });
      await createInBatches(areas, (data) => transaction.area.createMany({ data }));

      const lists = Array.from({ length: expected.lists }, (_, index) => {
        const id = index + 1;
        const areaId = Math.floor(index / profile.listsPerArea) + 1;
        const timestamp = new Date(BASE_TIME + id * 3_600_000);
        return {
          id,
          title: `${profile.prefix} Lista ${String(id).padStart(3, "0")}`,
          description: `${profile.prefix} lista da área ${areaId}`,
          areaId,
          createdAt: timestamp,
          updatedAt: timestamp,
          archivedAt: id === directArchivedListId
            ? new Date(BASE_TIME + 91 * 86_400_000)
            : null,
        };
      });
      await createInBatches(lists, (data) => transaction.list.createMany({ data }));

      const tasks = Array.from({ length: expected.tasks }, (_, index) => {
        const id = index + 1;
        const listId = Math.floor(index / profile.tasksPerList) + 1;
        const completed = id % 4 === 0;
        const timestamp = new Date(BASE_TIME + id * 60_000);
        return {
          id,
          title: `${profile.prefix} Tarefa ${String(id).padStart(5, "0")}`,
          description: `${profile.prefix} tarefa sintética ${id}`,
          dueDate: new Date(BASE_TIME + (id % 30) * 86_400_000),
          priority: PRIORITIES[(id - 1) % PRIORITIES.length],
          completed,
          completedAt: completed ? new Date(timestamp.getTime() + 60_000) : null,
          listId,
          createdAt: timestamp,
          updatedAt: timestamp,
          archivedAt: id === directArchivedTaskId
            ? new Date(BASE_TIME + 92 * 86_400_000)
            : null,
        };
      });
      await createInBatches(tasks, (data) => transaction.task.createMany({ data }));

      const checklistItems = Array.from(
        { length: expected.checklistItems },
        (_, index) => {
          const id = index + 1;
          const taskId = Math.floor(index / profile.checklistPerTask) + 1;
          const itemNumber = index % profile.checklistPerTask + 1;
          return {
            id,
            title: `${profile.prefix} Checklist ${String(taskId).padStart(5, "0")}.${itemNumber}`,
            completed: (taskId + itemNumber - 1) % 3 === 0,
            taskId,
            createdAt: new Date(BASE_TIME + taskId * 60_000 + itemNumber * 1_000),
          };
        },
      );
      await createInBatches(checklistItems, (data) =>
        transaction.checklistItem.createMany({ data }));

      const links = Array.from({ length: expected.links }, (_, index) => {
        const id = index + 1;
        const taskId = Math.floor(index / profile.linksPerTask) + 1;
        const linkNumber = index % profile.linksPerTask + 1;
        return {
          id,
          title: `${profile.prefix} Link ${String(taskId).padStart(5, "0")}.${linkNumber}`,
          url: `https://benchmark.invalid/tasks/${String(taskId).padStart(5, "0")}/${linkNumber}`,
          taskId,
          createdAt: new Date(BASE_TIME + taskId * 60_000 + linkNumber * 1_000),
        };
      });
      await createInBatches(links, (data) => transaction.link.createMany({ data }));

      // IDs explícitos mantêm relações determinísticas; as sequências são
      // reposicionadas para preservar o comportamento normal após o seed.
      await transaction.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"Area"', 'id'), MAX(id), true) FROM "Area"`,
      );
      await transaction.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"List"', 'id'), MAX(id), true) FROM "List"`,
      );
      await transaction.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"Task"', 'id'), MAX(id), true) FROM "Task"`,
      );
      await transaction.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"ChecklistItem"', 'id'), MAX(id), true) FROM "ChecklistItem"`,
      );
      await transaction.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"Link"', 'id'), MAX(id), true) FROM "Link"`,
      );
    }, { maxWait: 30_000, timeout: 300_000 });

    const [areas, lists, tasks, checklistItems, links, completedTasks,
      archivedAreas, archivedLists, archivedTasks] = await Promise.all([
      prisma.area.count(),
      prisma.list.count(),
      prisma.task.count(),
      prisma.checklistItem.count(),
      prisma.link.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.area.count({ where: { archivedAt: { not: null } } }),
      prisma.list.count({ where: { archivedAt: { not: null } } }),
      prisma.task.count({ where: { archivedAt: { not: null } } }),
    ]);

    const actual = { areas, lists, tasks, checklistItems, links };
    if (Object.entries(expected).some(([key, value]) =>
      actual[key as keyof typeof actual] !== value)) {
      throw new Error(`Contagens inesperadas após o seed: ${JSON.stringify(actual)}.`);
    }

    console.log(JSON.stringify({
      profile: profile.name,
      ...actual,
      completedTasks,
      archived: { areas: archivedAreas, lists: archivedLists, tasks: archivedTasks },
    }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedBenchmark(getBenchmarkProfile(process.argv[2])).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
