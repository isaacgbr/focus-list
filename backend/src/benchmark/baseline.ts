import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";

import { guardBenchmarkDatabase } from "./config.js";

type RecordWithId = { id: number; [key: string]: unknown };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} respondeu HTTP ${response.status}.`);
  return response.json() as Promise<T>;
}

let server: Server | undefined;
let prisma: PrismaClient | undefined;

try {
  const config = await guardBenchmarkDatabase();
  process.env.DATABASE_URL = config.benchmarkUrl;

  const [{ default: app }, prismaModule] = await Promise.all([
    import("../app.js"),
    import("../config/prisma.js"),
  ]);
  prisma = prismaModule.default;

  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server?.once("listening", resolve);
    server?.once("error", reject);
  });

  const address = server.address();
  assert(address && typeof address !== "string", "A API não abriu uma porta local.");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await getJson<{ status: string }>(baseUrl, "/health");
  assert(health.status === "OK", "A rota /health não confirmou a API.");

  const [areas, lists, tasks, checklistItems, links] = await Promise.all([
    getJson<RecordWithId[]>(baseUrl, "/areas"),
    getJson<RecordWithId[]>(baseUrl, "/lists"),
    getJson<RecordWithId[]>(baseUrl, "/tasks"),
    getJson<RecordWithId[]>(baseUrl, "/checklist-items"),
    getJson<RecordWithId[]>(baseUrl, "/links"),
  ]);

  assert(areas.length === 4, "Dashboard: quantidade de áreas ativas inesperada.");
  assert(lists.length === 19, "Dashboard: quantidade de listas ativas inesperada.");
  assert(tasks.length === 189, "Dashboard: quantidade de tarefas ativas inesperada.");
  assert(checklistItems.length === 750, "Checklist: quantidade inesperada.");
  assert(links.length === 250, "Links: quantidade inesperada.");

  const area = areas[0];
  const list = lists.find((item) => item.areaId === area.id);
  assert(list, "Não foi encontrada uma lista ativa da área de baseline.");
  const task = tasks.find((item) => item.listId === list.id);
  assert(task, "Não foi encontrada uma tarefa ativa da lista de baseline.");

  const [areaDetail, listDetail, taskDetail] = await Promise.all([
    getJson<RecordWithId>(baseUrl, `/areas/${area.id}`),
    getJson<RecordWithId>(baseUrl, `/lists/${list.id}`),
    getJson<RecordWithId>(baseUrl, `/tasks/${task.id}`),
  ]);
  assert(areaDetail.id === area.id, "Área não está acessível por ID.");
  assert(listDetail.id === list.id && listDetail.areaId === area.id, "Relação Área → Lista inválida.");
  assert(taskDetail.id === task.id && taskDetail.listId === list.id, "Relação Lista → Tarefa inválida.");
  assert(checklistItems.some((item) => item.taskId === task.id), "Checklist da tarefa não está acessível.");
  assert(links.some((item) => item.taskId === task.id), "Link da tarefa não está acessível.");

  const archived = await getJson<Array<RecordWithId & { type: string }>>(baseUrl, "/archived");
  assert(archived.some((item) => item.type === "area"), "Arquivo Central não retornou área.");
  assert(archived.some((item) => item.type === "list"), "Arquivo Central não retornou lista.");
  assert(archived.some((item) => item.type === "task"), "Arquivo Central não retornou tarefa.");

  await Promise.all(archived.map((item) => {
    const segment = item.type === "area" ? "areas" : item.type === "list" ? "lists" : "tasks";
    return getJson(baseUrl, `/archived/${segment}/${item.id}`);
  }));

  console.log(JSON.stringify({
    api: "OK",
    dashboard: { areas: areas.length, lists: lists.length, tasks: tasks.length },
    hierarchy: "OK",
    checklist: "OK",
    links: "OK",
    archive: "OK",
  }, null, 2));

} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  await prisma?.$disconnect();
}
