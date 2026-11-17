import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import areaRoutes from "./routes/area.routes.js";
import listRoutes from "./routes/list.routes.js";
import taskRoutes from "./routes/task.routes.js";
import checklistItemRoutes from "./routes/checklist-item.routes.js";
import linkRoutes from "./routes/link.routes.js";
import authRoutes from "./routes/auth.routes.js";
import demoRoutes from "./routes/demo.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import archiveRoutes from "./routes/archive.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { HttpError } from "./utils/http-error.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { trustedProxy } from "./config/server.js";
import { frontend } from "./middlewares/frontend.middleware.js";

const app = express();
app.set("trust proxy", trustedProxy());

app.disable("x-powered-by");
if (process.env.VERCEL === "1") {
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    // A API atual usa caminhos como /auth e /areas. /api não tem rotas públicas.
    if (/^\/api(?:\/|$)/i.test(req.path)) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.status(404).json({ message: "Recurso não encontrado." });
    }
    next();
  });
}
const origins = process.env.FRONTEND_ORIGIN
  ? [process.env.FRONTEND_ORIGIN]
  : process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://127.0.0.1:5173"];
// Opt-in para uma origem LAN exata, somente no desenvolvimento.
if (process.env.NODE_ENV !== "production" && process.env.FOCUSLIST_LAN_ORIGIN) {
  origins.push(process.env.FOCUSLIST_LAN_ORIGIN);
}
for (const origin of origins) {
  const url = new URL(origin);
  if (url.origin !== origin || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
    throw new Error("FRONTEND_ORIGIN deve ser uma origem exata, HTTPS em produção.");
  }
}
// Navegação/arquivos públicos não são API; links externos devem conseguir abrir a SPA.
if (process.env.NODE_ENV === "production" && process.env.VERCEL !== "1") app.use(frontend);
// Rejeita origens externas também no servidor (CORS sozinho não impede CSRF).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  const origin = req.get("Origin");
  if ((origin && !origins.includes(origin)) || req.get("Sec-Fetch-Site") === "cross-site") {
    throw new HttpError(403, "Origem não permitida.");
  }
  const hasBody = Number(req.get("Content-Length") ?? 0) > 0 || req.get("Transfer-Encoding") !== undefined;
  if (["POST", "PUT", "PATCH"].includes(req.method) && hasBody && req.path !== "/auth/logout" && !req.is("application/json")) {
    throw new HttpError(415, "Utilize application/json.");
  }
  next();
});
app.use(cors({ origin: origins, credentials: true }));

// Permite receber JSON no corpo das requisições.
const json = express.json({ limit: "32kb" });
app.use((req, res, next) => {
  if (req.method === "PUT" && req.path === "/profile/avatar") return next();
  return json(req, res, next);
});

// Rotas da aplicação.
app.use(healthRoutes);
app.use(authRoutes);
app.use(demoRoutes);
app.use(requireAuth);
app.use(profileRoutes);
app.use(dashboardRoutes);
app.use(archiveRoutes);
app.use(areaRoutes);
app.use(listRoutes);
app.use(taskRoutes);
app.use(checklistItemRoutes);
app.use(linkRoutes);
app.use((_req, res) => res.status(404).json({ message: "Recurso não encontrado." }));
// Middleware global de tratamento de erros.
// Deve ser registrado após todas as rotas.
app.use(errorMiddleware);

export default app;
