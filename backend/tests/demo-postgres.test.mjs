import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";

if (process.env.FOCUSLIST_AUTH_TESTS !== "LOCAL_CONTROLLED") throw new Error("Autorize os testes locais com FOCUSLIST_AUTH_TESTS=LOCAL_CONTROLLED.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname), "Somente PostgreSQL local.");
const { default: app } = await import("../dist/app.js");
const { default: prisma, disconnectDatabase } = await import("../dist/config/prisma.js");
const { cookieName, tokenHash } = await import("../dist/security/session.js");
const { default: demoRepository } = await import("../dist/repositories/demo.repository.js");

test("Modo Demonstração: HTTP, PostgreSQL, isolamento e transição REAL", async (t) => {
  const baseline = await prisma.user.count();
  const ids = new Set();
  const suffix = randomUUID();
  const password = "Demo-test-123";
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    try {
      await prisma.area.deleteMany({ where: { userId: { in: [...ids] } } });
      await prisma.user.deleteMany({ where: { id: { in: [...ids] } } });
      assert.equal(await prisma.user.count(), baseline, "Remove exclusivamente as fixtures desta execução");
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await disconnectDatabase();
    }
  });
  async function request(method, path, body, cookie) {
    const response = await fetch(`${base}${path}`, { method, headers: {
      "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    assert.doesNotMatch(text, /passwordHash|tokenHash|demoUserId|sessionId|Prisma|SELECT |stack/);
    assert.ok(!text.includes(password));
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  }
  async function expect(method, path, status, body, cookie) {
    const response = await request(method, path, body, cookie);
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(response.body)}`);
    return response;
  }
  const cookieOf = (response) => {
    const header = response.headers.get("set-cookie");
    assert.ok(header);
    assert.match(header, /HttpOnly/i);
    assert.match(header, /SameSite=Lax/i);
    return header.split(";")[0];
  };
  async function demo() {
    const response = await expect("POST", "/auth/demo", 200, {});
    ids.add(response.body.user.id);
    return { user: response.body.user, cookie: cookieOf(response) };
  }
  function account(label) {
    return { name: "Teste Demo", email: `demo-${label}-${suffix}@focuslist.invalid`, password, confirmPassword: password };
  }
  async function register(fixture, label) {
    const response = await expect("POST", "/auth/register", 201, { ...account(label), fromDemo: true }, fixture?.cookie);
    ids.add(response.body.user.id);
    assert.equal(response.body.user.type, "REAL");
    return { user: response.body.user, cookie: cookieOf(response) };
  }
  async function tree(fixture) {
    const area = (await expect("POST", "/areas", 201, { title: "Área Demo", description: "Descrição", icon: "heart", color: "#0b79ff" }, fixture.cookie)).body;
    const list = (await expect("POST", "/lists", 201, { title: "Lista", description: "Lista preservada", areaId: area.id }, fixture.cookie)).body;
    const task = (await expect("POST", "/tasks", 201, { title: "Tarefa", listId: list.id, priority: "HIGH", dueDate: "2026-12-20", completed: true, description: "Detalhes" }, fixture.cookie)).body;
    const check = (await expect("POST", "/checklist-items", 201, { text: "Checklist", taskId: task.id, completed: true }, fixture.cookie)).body;
    const link = (await expect("POST", "/links", 201, { title: "Referência", url: "https://example.com", taskId: task.id }, fixture.cookie)).body;
    return { area, list, task, check, link };
  }
  const resources = [["areas", "area"], ["lists", "list"], ["tasks", "task"], ["checklist-items", "check"], ["links", "link"]];
  let a, b, real, aTree, bTree, realTree;

  await t.test("A: Demo vazia, identidade sem credenciais, cookie seguro, refresh e retomada sem renovar 24h", async () => {
    a = await demo(); b = await demo();
    assert.notEqual(a.user.id, b.user.id);
    assert.equal(a.user.type, "DEMO");
    assert.equal(a.user.name, null); assert.equal(a.user.email, null);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: a.user.id } });
    assert.equal(stored.passwordHash, null);
    assert.equal(stored.expiresAt - stored.createdAt, 86400000);
    const token = a.cookie.split("=")[1];
    assert.match(token, /^[0-9a-f]{64}$/);
    const session = await prisma.session.findUniqueOrThrow({ where: { tokenHash: tokenHash(token) } });
    assert.notEqual(session.tokenHash, token);
    assert.equal(session.expiresAt.getTime(), stored.expiresAt.getTime());
    assert.deepEqual((await expect("GET", "/areas", 200, undefined, a.cookie)).body, []);
    assert.deepEqual((await expect("GET", "/auth/session", 200, undefined, a.cookie)).body.user, { ...a.user, demoImport: null });
    const resumed = await expect("POST", "/auth/demo", 200, {}, a.cookie);
    assert.equal(cookieOf(resumed), a.cookie);
    assert.deepEqual(resumed.body.user, a.user);
    assert.equal(await prisma.session.count({ where: { userId: a.user.id } }), 1);
    const response = await expect("POST", "/auth/register", 201, account("real"));
    ids.add(response.body.user.id);
    real = { user: response.body.user, cookie: cookieOf(await expect("POST", "/auth/login", 200, { email: account("real").email, password })) };
  });

  await t.test("B/C: CRUD real e isolamento bidirecional Demo A / Demo B / REAL em toda a árvore", async () => {
    aTree = await tree(a); bTree = await tree(b); realTree = await tree(real);
    for (const [current, own, others] of [[a, aTree, [bTree, realTree]], [b, bTree, [aTree, realTree]], [real, realTree, [aTree, bTree]]]) {
      for (const [route, key] of resources) {
        const collection = (await expect("GET", `/${route}`, 200, undefined, current.cookie)).body;
        assert.deepEqual(collection.map((item) => item.id), [own[key].id]);
        for (const other of others) {
          await expect("GET", `/${route}/${other[key].id}`, 404, undefined, current.cookie);
          await expect("PUT", `/${route}/${other[key].id}`, 404, { title: "Ataque" }, current.cookie);
          await expect("DELETE", `/${route}/${other[key].id}`, 404, undefined, current.cookie);
          if (["areas", "lists", "tasks"].includes(route)) {
            await expect("PATCH", `/${route}/${other[key].id}/archive`, 404, {}, current.cookie);
            await expect("PATCH", `/${route}/${other[key].id}/restore`, 404, {}, current.cookie);
          }
        }
      }
      for (const other of others) {
        for (const [route, key, parent] of [["lists", "list", { areaId: other.area.id }], ["tasks", "task", { listId: other.list.id }], ["checklist-items", "check", { taskId: other.task.id }], ["links", "link", { taskId: other.task.id }]]) {
          await expect("POST", `/${route}`, 404, { title: "Ataque", text: undefined, ...(route === "links" ? { url: "https://example.com" } : {}), ...parent }, current.cookie);
          await expect("PUT", `/${route}/${own[key].id}`, 404, parent, current.cookie);
        }
        assert.deepEqual((await expect("GET", `/tasks?listId=${other.list.id}`, 200, undefined, current.cookie)).body, []);
      }
    }
    for (const fixture of [[a, aTree], [b, bTree]]) {
      for (const [route, key] of resources) await expect("PUT", `/${route}/${fixture[1][key].id}`, 200, { title: "Editado" }, fixture[0].cookie);
      for (const [route, key] of resources.slice(0, 3).toReversed()) {
        await expect("PATCH", `/${route}/${fixture[1][key].id}/archive`, 200, {}, fixture[0].cookie);
        await expect("GET", `/archived/${route}/${fixture[1][key].id}`, 200, undefined, fixture[0].cookie);
        await expect("PATCH", `/${route}/${fixture[1][key].id}/restore`, 200, {}, fixture[0].cookie);
      }
    }
    const dashboard = (await expect("GET", "/dashboard?today=2026-10-28", 200, undefined, a.cookie)).body;
    assert.equal(dashboard.overview.total, 1);
    assert.deepEqual(dashboard.areas.map((item) => item.id), [aTree.area.id]);
    for (const [route, key] of resources.slice(0, 3).toReversed()) await expect("PATCH", `/${route}/${aTree[key].id}/archive`, 200, {}, a.cookie);
    await expect("GET", `/archived/tasks/${aTree.task.id}`, 404, undefined, real.cookie);
  });

  await t.test("CRUD Demo: exclusão da própria árvore respeita arquivamento e preserva os demais usuários", async () => {
    const own = await tree(b);
    await expect("DELETE", `/areas/${own.area.id}`, 400, undefined, b.cookie);
    for (const [route, key] of resources.slice(3)) {
      await expect("DELETE", `/${route}/${own[key].id}`, 204, undefined, b.cookie);
      await expect("GET", `/${route}/${own[key].id}`, 404, undefined, b.cookie);
    }
    for (const [route, key] of resources.slice(0, 3).toReversed()) {
      await expect("PATCH", `/${route}/${own[key].id}/archive`, 200, {}, b.cookie);
      await expect("DELETE", `/${route}/${own[key].id}`, 204, undefined, b.cookie);
      await expect("GET", `/archived/${route}/${own[key].id}`, 404, undefined, b.cookie);
    }
    await expect("GET", `/tasks/${bTree.task.id}`, 200, undefined, b.cookie);
    await expect("GET", `/archived/tasks/${aTree.task.id}`, 200, undefined, a.cookie);
    await expect("GET", `/tasks/${realTree.task.id}`, 200, undefined, real.cookie);
  });

  await t.test("H: sessão REAL preservada, corpos estritos e ausência de capacidade na sessão alheia", async () => {
    await expect("POST", "/auth/demo", 409, {}, real.cookie);
    await expect("POST", "/auth/demo/exit", 403, {}, real.cookie);
    await expect("POST", "/auth/register", 409, { ...account("blocked"), fromDemo: true }, real.cookie);
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, real.cookie);
    await expect("POST", "/auth/demo/resolve", 403, { action: "import" }, a.cookie);
    await expect("POST", "/auth/demo/resolve", 400, { action: "import", demoUserId: a.user.id }, real.cookie);
    await expect("POST", "/auth/demo", 400, { userId: real.user.id });
    await expect("GET", "/auth/session", 200, undefined, real.cookie);
    await expect("GET", "/auth/session", 401, undefined, `${a.cookie}; ${a.cookie}`);
  });

  let owner;
  await t.test("E: cadastro cria sessão REAL e vínculo persistente, revogando imediatamente a Demo", async () => {
    owner = await register(a, "import");
    assert.equal(owner.user.demoImport, "pending");
    assert.notEqual(owner.cookie, a.cookie);
    await expect("GET", "/areas", 401, undefined, a.cookie);
    const session = (await expect("GET", "/auth/session", 200, undefined, owner.cookie)).body.user;
    assert.equal(session.type, "REAL"); assert.equal(session.demoImport, "pending");
    assert.deepEqual((await expect("GET", "/areas", 200, undefined, owner.cookie)).body, []);
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, real.cookie);
  });

  await t.test("F: rollback real de toda a transferência em falha após as escritas", async () => {
    const original = prisma.$transaction;
    prisma.$transaction = (callback) => original.call(prisma, async (tx) => { await callback(tx); throw new Error("Falha controlada antes do commit"); });
    try { await expect("POST", "/auth/demo/resolve", 500, { action: "import" }, owner.cookie); }
    finally { prisma.$transaction = original; }
    assert.equal((await prisma.area.findUniqueOrThrow({ where: { id: aTree.area.id } })).userId, a.user.id);
    assert.equal((await prisma.demoTransfer.findUniqueOrThrow({ where: { demoUserId: a.user.id } })).resolvedAt, null);
  });

  await t.test("F: importação atômica concorrente preserva toda a hierarquia/atributos e a sessão final REAL", async () => {
    const include = { lists: { include: { tasks: { include: { checklist: true, links: true } } } } };
    const before = await prisma.area.findUniqueOrThrow({ where: { id: aTree.area.id }, include });
    const results = await Promise.all([request("POST", "/auth/demo/resolve", { action: "import" }, owner.cookie), request("POST", "/auth/demo/resolve", { action: "import" }, owner.cookie)]);
    assert.deepEqual(results.map((item) => item.status).sort(), [204, 409]);
    for (const result of results) assert.equal(result.headers.get("set-cookie"), null);
    const after = await prisma.area.findUniqueOrThrow({ where: { id: aTree.area.id }, include });
    assert.deepEqual(after, { ...before, userId: owner.user.id, updatedAt: after.updatedAt });
    const imported = (await expect("GET", `/archived/tasks/${aTree.task.id}`, 200, undefined, owner.cookie)).body;
    assert.equal(imported.checklist[0].id, aTree.check.id);
    assert.equal(imported.links[0].id, aTree.link.id);
    for (const [route, key] of resources.slice(0, 3)) await expect("PATCH", `/${route}/${aTree[key].id}/restore`, 200, {}, owner.cookie);
    assert.equal((await expect("GET", "/areas", 200, undefined, owner.cookie)).body[0].id, aTree.area.id);
    await expect("GET", "/areas", 401, undefined, a.cookie);
    await expect("GET", `/areas/${aTree.area.id}`, 404, undefined, b.cookie);
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, owner.cookie);
    assert.equal((await expect("GET", "/auth/session", 200, undefined, owner.cookie)).body.user.type, "REAL");
  });

  await t.test("G: começar do zero mantém conta e sessão REAL vazias, Demo anterior inacessível", async () => {
    const fresh = await register(b, "discard");
    await expect("POST", "/auth/demo/resolve", 204, { action: "discard" }, fresh.cookie);
    assert.deepEqual((await expect("GET", "/areas", 200, undefined, fresh.cookie)).body, []);
    await expect("GET", `/areas/${bTree.area.id}`, 404, undefined, fresh.cookie);
    await expect("GET", "/areas", 401, undefined, b.cookie);
    assert.equal((await expect("GET", "/auth/session", 200, undefined, fresh.cookie)).body.user.type, "REAL");
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, fresh.cookie);
  });

  async function expire(fixture) {
    const createdAt = new Date(Date.now() - 25 * 3600000);
    await prisma.user.update({ where: { id: fixture.user.id }, data: { createdAt, expiresAt: new Date(createdAt.getTime() + 86400000) } });
  }
  await t.test("D/E: validade do User bloqueia leitura/escrita mesmo com Session futura; cadastro expirado continua REAL", async () => {
    const expired = await demo();
    await expire(expired);
    for (const path of ["/areas", "/auth/session", "/tasks", "/archived", "/dashboard?today=2026-10-28"]) await expect("GET", path, 401, undefined, expired.cookie);
    await expect("POST", "/areas", 401, { title: "Expirada" }, expired.cookie);
    const fresh = await register(expired, "expired-register");
    assert.equal(fresh.user.demoImport, "unavailable");
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, fresh.cookie);
    await expect("GET", "/areas", 200, undefined, fresh.cookie);
  });

  await t.test("D/F: Demo que expira após cadastro não pode ser importada; permite começar do zero", async () => {
    const source = await demo();
    const area = (await expect("POST", "/areas", 201, { title: "Expira" }, source.cookie)).body;
    const target = await register(source, "expires-pending");
    await expire(source);
    assert.equal((await expect("GET", "/auth/session", 200, undefined, target.cookie)).body.user.demoImport, "unavailable");
    await expect("POST", "/auth/demo/resolve", 410, { action: "import" }, target.cookie);
    assert.equal((await prisma.area.findUniqueOrThrow({ where: { id: area.id } })).userId, source.user.id);
    await expect("POST", "/auth/demo/resolve", 204, { action: "discard" }, target.cookie);
    assert.deepEqual((await expect("GET", "/areas", 200, undefined, target.cookie)).body, []);
  });

  await t.test("perda de contexto e cookie inválido nunca importam dados; conta é utilizável", async () => {
    const target = await register(null, "lost-context");
    assert.equal(target.user.demoImport, "unavailable");
    await expect("POST", "/auth/demo/resolve", 409, { action: "import" }, target.cookie);
    await expect("GET", "/auth/session", 200, undefined, target.cookie);
    await expect("GET", "/areas", 401, undefined, `${cookieName}=${"f".repeat(64)}`);
  });

  await t.test("sair revoga a Demo, limpa cookie, impede retomada e só cria outra por ação explícita", async () => {
    const source = await demo();
    await tree(source);
    const result = await expect("POST", "/auth/demo/exit", 204, {}, source.cookie);
    assert.match(result.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
    await expect("GET", "/areas", 401, undefined, source.cookie);
    await expect("POST", "/auth/demo/exit", 401, {}, source.cookie);
    const next = await expect("POST", "/auth/demo", 200, {}, source.cookie);
    ids.add(next.body.user.id);
    assert.notEqual(next.body.user.id, source.user.id);
    assert.deepEqual((await expect("GET", "/areas", 200, undefined, cookieOf(next))).body, []);
    await expect("GET", "/auth/session", 200, undefined, real.cookie);
  });

  await t.test("limpeza física remove somente fixtures DEMO expiradas e preserva REAL/Demo válida", async (t) => {
    // A manutenção global só é exercitada quando todas as Demos são desta execução.
    // Nunca remove dados de outros visitantes num banco local compartilhado.
    const outsiders = await prisma.user.count({ where: { type: "DEMO", id: { notIn: [...ids] } } });
    if (outsiders) return t.skip("Há Demos externas às fixtures; manutenção global não será executada.");
    const valid = await demo();
    const validTree = await tree(valid);
    const expired = await prisma.user.findMany({ where: { type: "DEMO", id: { in: [...ids] }, expiresAt: { lte: new Date() } } });
    assert.ok(expired.length >= 2);
    const realBefore = await prisma.user.findMany({ where: { type: "REAL" }, orderBy: { id: "asc" } });
    const result = await demoRepository.cleanupExpired();
    assert.equal(result.count, expired.length);
    assert.deepEqual(await prisma.user.findMany({ where: { type: "REAL" }, orderBy: { id: "asc" } }), realBefore);
    assert.equal(await prisma.user.count({ where: { id: { in: expired.map(({ id }) => id) } } }), 0);
    assert.equal(await prisma.area.count({ where: { userId: { in: expired.map(({ id }) => id) } } }), 0);
    await expect("GET", `/tasks/${validTree.task.id}`, 200, undefined, valid.cookie);
    await expect("GET", `/tasks/${aTree.task.id}`, 200, undefined, owner.cookie);
    assert.equal((await demoRepository.cleanupExpired()).count, 0);
  });
});
