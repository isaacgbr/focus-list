import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import prisma from "../dist/config/prisma.js";
import areaService from "../dist/services/area.service.js";
import listService from "../dist/services/list.service.js";
import taskService from "../dist/services/task.service.js";
import linkService from "../dist/services/link.service.js";
import taskRepository from "../dist/repositories/task.repository.js";
import listRepository from "../dist/repositories/list.repository.js";
import linkRepository from "../dist/repositories/link.repository.js";

function replace(t, object, key, implementation) {
  const original = object[key];
  object[key] = implementation;
  t.after(() => { object[key] = original; });
}

test("criação controla completedAt e ignora o timestamp do cliente", async (t) => {
  t.mock.method(listRepository, "findById", async () => ({ id: 2 }));
  t.mock.method(taskRepository, "create", async (userId, data) => { assert.equal(userId, 1); return data; });
  for (const completed of [undefined, false, true]) for (const completedAt of [undefined, null, "2000-01-01T00:00:00Z"]) {
    const before = Date.now();
    const payload = { title: "Tarefa", listId: 2, completed, completedAt };
    const result = await taskService.create(1, payload);
    if (completed) {
      assert.ok(result.completedAt instanceof Date);
      assert.ok(result.completedAt.getTime() >= before && result.completedAt.getTime() <= Date.now());
    } else assert.equal(result.completedAt, null);
    assert.equal(payload.completedAt, completedAt, "Não modifica o DTO recebido.");
  }
});

test("Links validam HTTP/HTTPS na criação e edição e preservam atualizações sem URL", async (t) => {
  t.mock.method(taskRepository, "findAnyById", async () => ({ id: 2 }));
  t.mock.method(linkRepository, "findById", async () => ({ id: 3, taskId: 2 }));
  const writes = [];
  t.mock.method(linkRepository, "create", async (_userId, data) => { writes.push(data); return data; });
  t.mock.method(linkRepository, "update", async (_userId, _id, data) => { writes.push(data); return data; });
  for (const url of ["http://example.com", "https://example.com/path?q=1#section", "https://localhost:3000", "HTTPS://example.com"]) {
    assert.equal((await linkService.create(1, { title: "Referência", url, taskId: 2 })).url, url);
    assert.equal((await linkService.update(1, 3, { url })).url, url);
  }
  const count = writes.length;
  for (const url of ["", "   ", "example.com", "not a url", "/relative", "https://", "http:example.com", "https:/example.com", "http://exa mple.com", "javascript:alert(1)", "data:text/html,test", "file:///tmp/test", "ftp://example.com", "mailto:test@example.com"]) {
    await assert.rejects(linkService.create(1, { title: "Referência", url, taskId: 2 }), { status: 400 });
    await assert.rejects(linkService.update(1, 3, { url }), { status: 400 });
  }
  assert.equal(writes.length, count, "Entradas inválidas não chegam à escrita.");
  assert.deepEqual(await linkService.update(1, 3, { title: "Novo título" }), { title: "Novo título" });
});

for (const [model, service, owner] of [
  ["area", areaService, { userId: 1 }],
  ["list", listService, { area: { userId: 1 } }],
  ["task", taskService, { list: { area: { userId: 1 } } }],
]) {
  test(`${model}: exclusão revalida arquivamento e ownership na escrita`, async (t) => {
    let row = { id: 7, archivedAt: new Date(), ownerId: 1 };
    let restoreBeforeWrite = false;
    replace(t, prisma[model], "findUnique", async ({ where }) => where.id === row?.id && where.AND && row.ownerId === 1 ? { ...row } : null);
    replace(t, prisma[model], "delete", async ({ where }) => {
      assert.equal(where.id, 7);
      assert.deepEqual(where.AND, [owner]);
      assert.deepEqual(where.archivedAt, { not: null });
      if (restoreBeforeWrite) row.archivedAt = null;
      if (!row?.archivedAt || row.ownerId !== 1) throw new Prisma.PrismaClientKnownRequestError("not found", { code: "P2025", clientVersion: "test" });
      const deleted = row; row = null; return deleted;
    });
    restoreBeforeWrite = true;
    await assert.rejects(service.delete(1, 7), { code: "P2025" });
    assert.ok(row, "Restauração entre leitura e escrita preserva o registro.");
    await assert.rejects(service.delete(1, 7), { status: 400 });
    row.archivedAt = new Date();
    row.ownerId = 2;
    await assert.rejects(service.delete(1, 7), { status: 404 });
    row.ownerId = 1;
    restoreBeforeWrite = false;
    assert.equal((await service.delete(1, 7)).id, 7);
    assert.equal(row, null);
  });
}
