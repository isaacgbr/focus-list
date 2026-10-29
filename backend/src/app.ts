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
import { requireAuth } from "./middlewares/auth.middleware.js";
import { HttpError } from "./utils/http-error.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.disable("x-powered-by");
const origins = process.env.FRONTEND_ORIGIN
  ? [process.env.FRONTEND_ORIGIN]
  : process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://127.0.0.1:5173"];
for (const origin of origins) {
  const url = new URL(origin);
  if (url.origin !== origin || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) {
    throw new Error("FRONTEND_ORIGIN deve ser uma origem exata, HTTPS em produção.");
  }
}
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
app.use(express.json({ limit: "32kb" }));

// Rotas da aplicação.
app.use(healthRoutes);
app.use(authRoutes);
app.use(demoRoutes);
app.use(requireAuth);
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
