import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { spawnSync } from "node:child_process";

// Nunca usa banco remoto; a confirmação deve ser dada explicitamente no processo.
if (process.env.FOCUSLIST_AUTH_TESTS !== "LOCAL_CONTROLLED") {
  throw new Error("Defina FOCUSLIST_AUTH_TESTS=LOCAL_CONTROLLED para autorizar os testes locais.");
}
const target = new URL(process.env.DATABASE_URL);
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname), "Somente PostgreSQL local.");

const { default: app } = await import("../dist/app.js");
const { default: prisma, disconnectDatabase } = await import("../dist/config/prisma.js");
const { tokenHash, cookieName } = await import("../dist/security/session.js");

test("autenticação e isolamento real no PostgreSQL", async (t) => {
  const suffix = randomUUID();
  const password = `Strong test password ${suffix}`;
  const accounts = ["a", "b"].map((name) => ({
    name: `Teste ${name.toUpperCase()}`, email: `auth-test-${name}-${suffix}@focuslist.invalid`, password, confirmPassword: password,
  }));
  const emails = accounts.map((account) => account.email);
  const secrets = [password];
  const baseline = await prisma.user.count();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    try {
      // Remove exclusivamente as contas desta execução e sua árvore de dados.
      await prisma.area.deleteMany({ where: { user: { email: { in: emails } } } });
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
      assert.equal(await prisma.user.count(), baseline);
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await disconnectDatabase();
    }
  });

  async function request(method, path, body, cookie, extraHeaders = {}) {
    const response = await fetch(`${base}${path}`, {
      method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (text) {
      assert.doesNotMatch(text, /passwordHash|tokenHash|confirmPassword|"password"|"token"|Prisma|SELECT |stack/i);
      for (const secret of secrets) assert.ok(!text.includes(secret), "Segredos ausentes do JSON.");
    }
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  }
  async function expect(method, path, status, body, cookie, headers) {
    const response = await request(method, path, body, cookie, headers);
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(response.body)}`);
    return response;
  }
  function readCookie(response) {
    const header = response.headers.get("set-cookie");
    assert.ok(header);
    const cookie = header.split(";")[0];
    secrets.push(cookie.split("=")[1]);
    return cookie;
  }
  const fixtures = [];

  await t.test("cadastro valida nome, e-mail, senha, confirmação e campos extras", async () => {
    for (const change of [{ name: " " }, { name: 12 }, { email: "invalid" }, { password: "short", confirmPassword: "short" }, { confirmPassword: "wrong" }, { type: "DEMO" }, { userId: 1 }, { passwordHash: "injected" }]) {
      await expect("POST", "/auth/register", 400, { ...accounts[0], ...change });
    }
    await expect("POST", "/auth/register", 400, []);
  });

  await t.test("cadastro A/B normaliza e-mail e persiste scrypt com salts diferentes", async () => {
    for (const account of accounts) {
      const result = await expect("POST", "/auth/register", 201, { ...account, email: ` ${account.email.toUpperCase()} ` });
      assert.equal(result.body.user.email, account.email);
      assert.deepEqual(Object.keys(result.body.user).sort(), ["createdAt", "email", "id", "name"]);
      fixtures.push({ user: result.body.user });
    }
    const stored = await prisma.user.findMany({ where: { email: { in: emails } } });
    for (const user of stored) {
      assert.equal(user.type, "REAL");
      assert.match(user.passwordHash, /^scrypt\$131072\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
      assert.notEqual(user.passwordHash, password);
      secrets.push(user.passwordHash);
    }
    assert.notEqual(stored[0].passwordHash, stored[1].passwordHash);
  });

  await t.test("e-mail duplicado é rejeitado sem detalhes internos", async () => {
    await expect("POST", "/auth/register", 400, { ...accounts[0], email: accounts[0].email.toUpperCase() });
    assert.equal(await prisma.user.count({ where: { email: accounts[0].email } }), 1);
  });

  await t.test("login ausente e senha incorreta têm a mesma resposta", async () => {
    const wrong = await expect("POST", "/auth/login", 401, { email: emails[0], password: "wrong password value" });
    const missing = await expect("POST", "/auth/login", 401, { email: `missing-${suffix}@focuslist.invalid`, password });
    assert.deepEqual(wrong.body, missing.body);
    await expect("POST", "/auth/login", 400, { email: emails[0], password, userId: fixtures[1].user.id });
  });

  await t.test("login, cookie HttpOnly/Lax por 7 dias e apenas hash da sessão no banco", async () => {
    for (let i = 0; i < fixtures.length; i++) {
      const response = await expect("POST", "/auth/login", 200, { email: ` ${emails[i].toUpperCase()} `, password });
      fixtures[i].cookie = readCookie(response);
      const header = response.headers.get("set-cookie");
      assert.match(header, /HttpOnly/i);
      assert.match(header, /SameSite=Lax/i);
      assert.match(header, /Max-Age=604800/);
      assert.match(header, /Path=\//);
      assert.doesNotMatch(header, /Domain=/i);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const token = fixtures[i].cookie.split("=")[1];
      assert.match(token, /^[0-9a-f]{64}$/);
      const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) } });
      assert.equal(session.userId, fixtures[i].user.id);
      assert.notEqual(session.tokenHash, token);
      assert.ok(Math.abs(session.expiresAt - session.createdAt - 604800000) < 10000);
      const current = await expect("GET", "/auth/session", 200, undefined, fixtures[i].cookie);
      assert.equal(current.body.user.id, fixtures[i].user.id);
    }
  });

  await t.test("cookie Secure e prefixo __Host- em produção", () => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", 'const s = await import("./dist/security/session.js"); if (!s.cookieOptions.secure || s.cookieName !== "__Host-focuslist_session" || s.cookieOptions.path !== "/" || s.cookieOptions.domain) process.exit(1);'], {
      cwd: process.cwd(), env: { ...process.env, NODE_ENV: "production" }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
  });

  await t.test("sem sessão ou com cookie falso não acessa nenhuma rota do domínio", async () => {
    for (const path of ["/areas", "/lists", "/tasks", "/checklist-items", "/links", "/dashboard?today=2026-10-26", "/archived", "/archived/areas/1", "/archived/lists/1", "/archived/tasks/1", "/auth/session"]) {
      await expect("GET", path, 401);
      if (path.startsWith("/dashboard") || path.startsWith("/archived")) {
        await expect("GET", path, 401, undefined, `${cookieName}=${"a".repeat(64)}`);
      }
    }
    for (const route of ["areas", "lists", "tasks"]) {
      await expect("PATCH", `/${route}/1/restore`, 401, {});
      await expect("DELETE", `/${route}/1`, 401);
    }
    await expect("POST", "/areas", 401, { title: "No session" });
    await expect("GET", "/areas", 401, undefined, `${cookieName}=${"a".repeat(64)}`);
    await expect("GET", "/areas", 401, undefined, `${fixtures[0].cookie}; ${fixtures[0].cookie}`);
  });

  await t.test("CORS com credenciais e rejeição de origem externa/CSRF", async () => {
    const allowed = await expect("GET", "/areas", 200, undefined, fixtures[0].cookie, { Origin: "http://localhost:5173" });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
    await expect("POST", "/areas", 403, { title: "CSRF" }, fixtures[0].cookie, { Origin: "https://external.invalid" });
    await expect("POST", "/auth/logout", 403, {}, fixtures[0].cookie, { Origin: "null" });
    await expect("POST", "/areas", 415, { title: "Form" }, fixtures[0].cookie, { "Content-Type": "text/plain" });
  });

  await t.test("JSON inválido e payload excessivo retornam erros controlados", async () => {
    for (const [body, status, message] of [["{", 400, "JSON inválido."], [JSON.stringify({ title: "x".repeat(33000) }), 413, "Corpo da requisição muito grande."]]) {
      const response = await fetch(`${base}/areas`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: fixtures[0].cookie }, body });
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { message });
    }
  });

  await t.test("erros inesperados não retornam mensagens internas", async () => {
    const { errorMiddleware } = await import("../dist/middlewares/error.middleware.js");
    let status;
    let body;
    const response = { headersSent: false, status(value) { status = value; return this; }, json(value) { body = value; return this; } };
    errorMiddleware(new Error("internal passwordHash/tokenHash/database credentials"), {}, response, () => assert.fail());
    assert.equal(status, 500);
    assert.deepEqual(body, { message: "Erro interno do servidor." });
  });

  await t.test("A/B criam a própria árvore; propriedade vem exclusivamente da sessão", async () => {
    for (const fixture of fixtures) {
      fixture.area = (await expect("POST", "/areas", 201, { title: `Área ${fixture.user.name}` }, fixture.cookie)).body;
      assert.equal(fixture.area.userId, fixture.user.id);
      fixture.list = (await expect("POST", "/lists", 201, { title: "Lista", areaId: fixture.area.id }, fixture.cookie)).body;
      fixture.task = (await expect("POST", "/tasks", 201, { title: "Tarefa", listId: fixture.list.id }, fixture.cookie)).body;
      fixture.checklist = (await expect("POST", "/checklist-items", 201, { text: "Item", taskId: fixture.task.id }, fixture.cookie)).body;
      fixture.link = (await expect("POST", "/links", 201, { title: "Link", url: "https://example.com", taskId: fixture.task.id }, fixture.cookie)).body;
      await expect("POST", "/areas", 400, { title: "Injeção", userId: fixture.user.id }, fixture.cookie);
      await expect("PUT", `/areas/${fixture.area.id}`, 400, { userId: fixture.user.id }, fixture.cookie);
      await expect("POST", "/areas", 400, { title: 123 }, fixture.cookie);
      await expect("GET", "/areas/invalid", 400, undefined, fixture.cookie);
      await expect("GET", "/tasks?listId=invalid", 400, undefined, fixture.cookie);
    }
  });

  await t.test("datas aceitas pela validação são normalizadas antes de persistir no Prisma", async () => {
    const fixture = fixtures[0];
    const response = await expect("PUT", `/tasks/${fixture.task.id}`, 200, { dueDate: "2026-10-26" }, fixture.cookie);
    assert.equal(response.body.dueDate, "2026-10-26T00:00:00.000Z");
    await expect("PUT", `/tasks/${fixture.task.id}`, 400, { dueDate: "invalid" }, fixture.cookie);
    await expect("PUT", `/tasks/${fixture.task.id}`, 400, { dueDate: 123 }, fixture.cookie);
  });

  const resources = [["areas", "area"], ["lists", "list"], ["tasks", "task"], ["checklist-items", "checklist"], ["links", "link"]];
  for (const [index, current] of fixtures.entries()) {
    const other = fixtures[1 - index];
    await t.test(`${current.user.name}: coleções e filtros não retornam dados alheios`, async () => {
      for (const [route, key] of resources) {
        const response = await expect("GET", `/${route}`, 200, undefined, current.cookie);
        assert.ok(response.body.some((item) => item.id === current[key].id));
        assert.ok(!response.body.some((item) => item.id === other[key].id));
      }
      for (const path of [`/lists?areaId=${other.area.id}`, `/tasks?areaId=${other.area.id}`, `/tasks?listId=${other.list.id}`, `/checklist-items?taskId=${other.task.id}`, `/links?listId=${other.list.id}`]) {
        assert.deepEqual((await expect("GET", path, 200, undefined, current.cookie)).body, []);
      }
    });
    await t.test(`${current.user.name}: consulta/edição/exclusão/arquivamento/restauração alheios são 404`, async () => {
      for (const [route, key] of resources) {
        await expect("GET", `/${route}/${current[key].id}`, 200, undefined, current.cookie);
        await expect("GET", `/${route}/${other[key].id}`, 404, undefined, current.cookie);
        await expect("PUT", `/${route}/${other[key].id}`, 404, { title: "Ataque" }, current.cookie);
        await expect("DELETE", `/${route}/${other[key].id}`, 404, undefined, current.cookie);
        if (["areas", "lists", "tasks"].includes(route)) {
          await expect("PATCH", `/${route}/${other[key].id}/archive`, 404, {}, current.cookie);
          await expect("PATCH", `/${route}/${other[key].id}/restore`, 404, {}, current.cookie);
        }
      }
    });
    await t.test(`${current.user.name}: criação e transferência para pai alheio são 404`, async () => {
      for (const [route, key, data] of [
        ["lists", "list", { areaId: other.area.id }], ["tasks", "task", { listId: other.list.id }],
        ["checklist-items", "checklist", { taskId: other.task.id }], ["links", "link", { taskId: other.task.id }],
      ]) {
        await expect("POST", `/${route}`, 404, { title: "Ataque", ...(route === "links" ? { url: "https://example.com" } : {}), ...data }, current.cookie);
        await expect("PUT", `/${route}/${current[key].id}`, 404, data, current.cookie);
      }
    });
  }

  await t.test("Dashboard rejeita datas ausentes, malformadas e impossíveis com 400", async () => {
    for (const query of ["", "?today=invalid", "?today=2026-02-30", "?today=2026-13-01", "?today=2026-10-26&today=2026-10-27"]) {
      const response = await expect("GET", `/dashboard${query}`, 400, undefined, fixtures[0].cookie);
      assert.deepEqual(response.body, { message: "A data do Dashboard é inválida." });
    }
  });

  await t.test("Dashboard A/B isola todas as métricas, tarefas, áreas e atalhos", async () => {
    const extras = [];
    for (const [index, fixture] of fixtures.entries()) {
      await expect("PUT", `/tasks/${fixture.task.id}`, 200, { dueDate: "2026-10-24T00:00:00.000Z" }, fixture.cookie);
      // Quantidades diferentes impedem que contagens globais passem despercebidas.
      for (const data of [
        { dueDate: "2026-10-26T00:00:00.000Z" },
        { dueDate: "2026-10-27T00:00:00.000Z" },
        ...Array.from({ length: index + 1 }, () => ({ completed: true })),
        { dueDate: "2026-11-03T00:00:00.000Z" },
      ]) {
        const task = (await expect("POST", "/tasks", 201, { title: `Extra ${fixture.user.name}`, listId: fixture.list.id, ...data }, fixture.cookie)).body;
        extras.push({ fixture, task });
      }
    }
    for (const [index, fixture] of fixtures.entries()) {
      const other = fixtures[1 - index];
      const path = "/dashboard?today=2026-10-26";
      const summary = (await expect("GET", path, 200, undefined, fixture.cookie)).body;
      assert.deepEqual(summary.attention, { overdue: 1, today: 1, week: 1, earliestOverdue: "2026-10-24T00:00:00.000Z" });
      assert.deepEqual(summary.overview, { total: 5 + index, pending: 4, completed: index + 1, completionPercentage: Math.round((index + 1) / (5 + index) * 100) });
      assert.deepEqual(summary.areas, [{ id: fixture.area.id, title: fixture.area.title, color: fixture.area.color, listsTotal: 1, tasksTotal: 5 + index }]);
      assert.equal(summary.firstAreaId, fixture.area.id);
      assert.deepEqual(summary.firstList, { id: fixture.list.id, areaId: fixture.area.id });
      const ownIds = [fixture.task.id, ...extras.filter((extra) => extra.fixture === fixture).map((extra) => extra.task.id)];
      for (const task of [...summary.inProgress, ...summary.upcoming]) {
        assert.ok(ownIds.includes(task.id));
        assert.equal(task.listId, fixture.list.id);
        assert.equal(task.areaId, fixture.area.id);
      }
      assert.equal(summary.inProgress.length, 3);
      assert.equal(summary.upcoming.length, 2);
      // Um userId no cliente nunca substitui o dono da sessão.
      assert.deepEqual((await expect("GET", `${path}&userId=${other.user.id}`, 200, undefined, fixture.cookie)).body, summary);
      const overdue = (await expect("PUT", `/tasks/${fixture.task.id}`, 200, { dueDate: "2026-10-24T00:00:00.000Z" }, fixture.cookie)).body;
      assert.equal(overdue.id, fixture.task.id);
    }
    for (const { fixture, task } of extras) {
      await expect("PATCH", `/tasks/${task.id}/archive`, 200, {}, fixture.cookie);
      await expect("DELETE", `/tasks/${task.id}`, 204, undefined, fixture.cookie);
    }
  });

  await t.test("Arquivados A/B isola detalhes e operações e preserva a hierarquia", async () => {
    for (const fixture of fixtures) {
      for (const [route, key] of [["tasks", "task"], ["lists", "list"], ["areas", "area"]]) {
        await expect("PATCH", `/${route}/${fixture[key].id}/archive`, 200, {}, fixture.cookie);
      }
    }
    for (const [index, fixture] of fixtures.entries()) {
      const other = fixtures[1 - index];
      for (const [route, key] of [["areas", "area"], ["lists", "list"], ["tasks", "task"]]) {
        await expect("GET", `/archived/${route}/${fixture[key].id}`, 200, undefined, fixture.cookie);
        await expect("GET", `/archived/${route}/${other[key].id}`, 404, undefined, fixture.cookie);
        await expect("PATCH", `/${route}/${other[key].id}/restore`, 404, {}, fixture.cookie);
        await expect("DELETE", `/${route}/${other[key].id}`, 404, undefined, fixture.cookie);
        await expect("GET", `/archived/${route}/2147483647`, 404, undefined, fixture.cookie);
        await expect("GET", `/archived/${route}/invalid`, 400, undefined, fixture.cookie);
      }
      const archived = (await expect("GET", `/archived?userId=${other.user.id}`, 200, undefined, fixture.cookie)).body;
      assert.deepEqual(archived.map(({ id, type, listCount, taskCount }) => ({ id, type, listCount, taskCount })), [
        { id: fixture.area.id, type: "area", listCount: 1, taskCount: 1 },
      ]);
      await expect("PATCH", `/lists/${fixture.list.id}/restore`, 400, {}, fixture.cookie);
      await expect("PATCH", `/tasks/${fixture.task.id}/restore`, 400, {}, fixture.cookie);
    }
    for (const fixture of fixtures) {
      await expect("PATCH", `/areas/${fixture.area.id}/restore`, 200, {}, fixture.cookie);
      assert.deepEqual((await expect("GET", "/archived", 200, undefined, fixture.cookie)).body.map(({ id, type }) => ({ id, type })), [{ id: fixture.list.id, type: "list" }]);
      await expect("PATCH", `/tasks/${fixture.task.id}/restore`, 400, {}, fixture.cookie);
      await expect("PATCH", `/lists/${fixture.list.id}/restore`, 200, {}, fixture.cookie);
      assert.deepEqual((await expect("GET", "/archived", 200, undefined, fixture.cookie)).body.map(({ id, type }) => ({ id, type })), [{ id: fixture.task.id, type: "task" }]);
      await expect("PATCH", `/tasks/${fixture.task.id}/restore`, 200, {}, fixture.cookie);
      assert.deepEqual((await expect("GET", "/archived", 200, undefined, fixture.cookie)).body, []);
      // Descendentes ativos continuam consultáveis pelo arquivo de um pai arquivado.
      await expect("PATCH", `/areas/${fixture.area.id}/archive`, 200, {}, fixture.cookie);
      await expect("GET", `/archived/lists/${fixture.list.id}`, 200, undefined, fixture.cookie);
      const task = (await expect("GET", `/archived/tasks/${fixture.task.id}`, 200, undefined, fixture.cookie)).body;
      assert.deepEqual(task.checklist.map(({ id }) => id), [fixture.checklist.id]);
      assert.deepEqual(task.links.map(({ id }) => id), [fixture.link.id]);
      const dashboard = (await expect("GET", "/dashboard?today=2026-10-26", 200, undefined, fixture.cookie)).body;
      assert.deepEqual(dashboard.overview, { total: 0, pending: 0, completed: 0, completionPercentage: 0 });
      assert.deepEqual(dashboard.attention, { overdue: 0, today: 0, week: 0, earliestOverdue: null });
      assert.deepEqual(dashboard.areas, []);
      assert.deepEqual(dashboard.inProgress, []);
      assert.deepEqual(dashboard.upcoming, []);
      assert.equal(dashboard.firstAreaId, null);
      assert.equal(dashboard.firstList, null);
      await expect("PATCH", `/areas/${fixture.area.id}/restore`, 200, {}, fixture.cookie);
      for (const [route, key] of [["areas", "area"], ["lists", "list"], ["tasks", "task"]]) {
        await expect("GET", `/archived/${route}/${fixture[key].id}`, 404, undefined, fixture.cookie);
      }
    }
  });

  await t.test("operações legítimas, arquivamento/restauração e exclusão mantêm isolamento", async () => {
    for (const [index, fixture] of fixtures.entries()) {
      const other = fixtures[1 - index];
      for (const [route, key] of resources) {
        await expect("PUT", `/${route}/${fixture[key].id}`, 200, { title: "Atualizado" }, fixture.cookie);
      }
      await expect("PUT", `/tasks/${fixture.task.id}`, 200, { description: null, dueDate: null, priority: null }, fixture.cookie);
      for (const [route, key] of [["tasks", "task"], ["lists", "list"], ["areas", "area"]]) {
        await expect("PATCH", `/${route}/${fixture[key].id}/archive`, 200, undefined, fixture.cookie);
        await expect("PATCH", `/${route}/${fixture[key].id}/restore`, 404, {}, other.cookie);
        await expect("DELETE", `/${route}/${fixture[key].id}`, 404, undefined, other.cookie);
        await expect("PATCH", `/${route}/${fixture[key].id}/restore`, 200, {}, fixture.cookie);
      }
    }
    for (const fixture of fixtures) {
      await expect("DELETE", `/areas/${fixture.area.id}`, 400, undefined, fixture.cookie);
      await expect("DELETE", `/checklist-items/${fixture.checklist.id}`, 204, undefined, fixture.cookie);
      await expect("DELETE", `/links/${fixture.link.id}`, 204, undefined, fixture.cookie);
      for (const [route, key] of [["tasks", "task"], ["lists", "list"], ["areas", "area"]]) {
        await expect("PATCH", `/${route}/${fixture[key].id}/archive`, 200, {}, fixture.cookie);
        await expect("DELETE", `/${route}/${fixture[key].id}`, 204, undefined, fixture.cookie);
      }
    }
  });

  await t.test("novo login rotaciona token e revoga sessão anterior", async () => {
    const fixture = fixtures[0];
    const old = fixture.cookie;
    fixture.cookie = readCookie(await expect("POST", "/auth/login", 200, { email: emails[0], password }, old));
    assert.notEqual(fixture.cookie, old);
    await expect("GET", "/auth/session", 401, undefined, old);
    await expect("GET", "/auth/session", 200, undefined, fixture.cookie);
  });

  await t.test("sessão expirada e revogada são rejeitadas no servidor", async () => {
    const fixture = fixtures[1];
    const hash = tokenHash(fixture.cookie.split("=")[1]);
    await prisma.session.update({ where: { tokenHash: hash }, data: { createdAt: new Date(Date.now() - 2 * 86400000), expiresAt: new Date(Date.now() - 86400000) } });
    await expect("GET", "/auth/session", 401, undefined, fixture.cookie);
    fixture.cookie = readCookie(await expect("POST", "/auth/login", 200, { email: emails[1], password }));
    await prisma.session.update({ where: { tokenHash: tokenHash(fixture.cookie.split("=")[1]) }, data: { revokedAt: new Date() } });
    await expect("GET", "/areas", 401, undefined, fixture.cookie);
  });

  await t.test("logout revoga apenas sessão atual, limpa cookie e impede reutilização", async () => {
    const fixture = fixtures[0];
    const parallel = readCookie(await expect("POST", "/auth/login", 200, { email: emails[0], password }));
    const response = await expect("POST", "/auth/logout", 204, {}, fixture.cookie);
    assert.match(response.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
    assert.ok((await prisma.session.findUnique({ where: { tokenHash: tokenHash(fixture.cookie.split("=")[1]) } })).revokedAt);
    await expect("GET", "/auth/session", 401, undefined, fixture.cookie);
    await expect("GET", "/auth/session", 200, undefined, parallel);
    await expect("POST", "/auth/logout", 204, {}, parallel);
  });

  await t.test("limita tentativas de autenticação sem revelar existência de conta", async () => {
    let limited = false;
    for (let i = 0; i < 31; i++) {
      const response = await request("POST", "/auth/login", {});
      if (response.status === 429) { limited = true; assert.ok(response.headers.get("retry-after")); break; }
      assert.equal(response.status, 400);
    }
    assert.ok(limited);
  });
});
