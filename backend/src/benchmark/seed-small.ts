import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";
import { Pool } from "pg";

import { guardBenchmarkDatabase } from "./config.js";

const PREFIX = "[BENCH-SMALL]";
const BASE_TIME = Date.UTC(2026, 0, 1, 12, 0, 0);
const COLORS = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#475569"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export async function seedSmallBenchmark() {
  const config = await guardBenchmarkDatabase();
  process.env.DATABASE_URL = config.benchmarkUrl;

  const pool = new Pool({
    connectionString: config.benchmarkUrl,
    application_name: "focuslist-benchmark-seed-small",
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.$transaction(async (transaction) => {
      // O banco é exclusivo para benchmark e já passou pelas travas. A limpeza
      // integral, transacional e com reinício dos IDs evita filtros frágeis e
      // torna cada execução reproduzível.
      await transaction.$executeRaw`
        TRUNCATE TABLE "ChecklistItem", "Link", "Task", "List", "Area"
        RESTART IDENTITY CASCADE
      `;

      for (let areaNumber = 1; areaNumber <= 5; areaNumber += 1) {
        const areaArchivedAt = areaNumber === 5
          ? new Date(BASE_TIME + 90 * 86_400_000)
          : null;

        await transaction.area.create({
          data: {
            title: `${PREFIX} Área ${String(areaNumber).padStart(2, "0")}`,
            description: `${PREFIX} dados sintéticos determinísticos`,
            color: COLORS[areaNumber - 1],
            icon: "Folder",
            createdAt: new Date(BASE_TIME + areaNumber * 86_400_000),
            updatedAt: new Date(BASE_TIME + areaNumber * 86_400_000),
            archivedAt: areaArchivedAt,
            lists: {
              create: Array.from({ length: 5 }, (_, listOffset) => {
                const listNumber = listOffset + 1;
                const globalList = (areaNumber - 1) * 5 + listNumber;
                const listArchivedAt = areaNumber === 4 && listNumber === 5
                  ? new Date(BASE_TIME + 91 * 86_400_000)
                  : null;

                return {
                  title: `${PREFIX} Lista ${String(globalList).padStart(2, "0")}`,
                  description: `${PREFIX} lista da área ${areaNumber}`,
                  createdAt: new Date(BASE_TIME + globalList * 3_600_000),
                  updatedAt: new Date(BASE_TIME + globalList * 3_600_000),
                  archivedAt: listArchivedAt,
                  tasks: {
                    create: Array.from({ length: 10 }, (_, taskOffset) => {
                      const taskNumber = taskOffset + 1;
                      const globalTask = (globalList - 1) * 10 + taskNumber;
                      const completed = globalTask % 4 === 0;
                      const createdAt = new Date(BASE_TIME + globalTask * 60_000);
                      const taskArchivedAt = areaNumber === 4
                        && listNumber === 4
                        && taskNumber === 10
                        ? new Date(BASE_TIME + 92 * 86_400_000)
                        : null;

                      return {
                        title: `${PREFIX} Tarefa ${String(globalTask).padStart(3, "0")}`,
                        description: `${PREFIX} tarefa sintética ${globalTask}`,
                        dueDate: new Date(BASE_TIME + (globalTask % 30) * 86_400_000),
                        priority: PRIORITIES[(globalTask - 1) % PRIORITIES.length],
                        completed,
                        completedAt: completed
                          ? new Date(BASE_TIME + (globalTask + 1) * 60_000)
                          : null,
                        createdAt,
                        updatedAt: createdAt,
                        archivedAt: taskArchivedAt,
                        checklist: {
                          create: Array.from({ length: 3 }, (_, itemOffset) => ({
                            title: `${PREFIX} Checklist ${String(globalTask).padStart(3, "0")}.${itemOffset + 1}`,
                            completed: (globalTask + itemOffset) % 3 === 0,
                            createdAt: new Date(createdAt.getTime() + itemOffset * 1_000),
                          })),
                        },
                        links: {
                          create: {
                            title: `${PREFIX} Link ${String(globalTask).padStart(3, "0")}`,
                            url: `https://benchmark.invalid/tasks/${String(globalTask).padStart(3, "0")}`,
                            createdAt,
                          },
                        },
                      };
                    }),
                  },
                };
              }),
            },
          },
        });
      }
    }, { maxWait: 30_000, timeout: 60_000 });

    const [areas, lists, tasks, checklistItems, links, completedTasks, archivedAreas, archivedLists, archivedTasks] = await Promise.all([
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

    const expected = [5, 25, 250, 750, 250];
    const actual = [areas, lists, tasks, checklistItems, links];
    if (actual.some((value, index) => value !== expected[index])) {
      throw new Error(`Contagens inesperadas após o seed: ${actual.join(", ")}.`);
    }

    console.log(JSON.stringify({
      profile: "small",
      areas,
      lists,
      tasks,
      checklistItems,
      links,
      completedTasks,
      archived: { areas: archivedAreas, lists: archivedLists, tasks: archivedTasks },
    }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedSmallBenchmark().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
