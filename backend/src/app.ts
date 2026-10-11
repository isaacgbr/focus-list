import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import areaRoutes from "./routes/area.routes.js";
import listRoutes from "./routes/list.routes.js";
import taskRoutes from "./routes/task.routes.js";
import checklistItemRoutes from "./routes/checklist-item.routes.js";
import linkRoutes from "./routes/link.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

// Permite requisições de outras origens (Frontend -> Backend).
app.use(cors());

// Permite receber JSON no corpo das requisições.
app.use(express.json());

// Rotas da aplicação.
app.use(healthRoutes);
app.use(areaRoutes);
app.use(listRoutes);
app.use(taskRoutes);
app.use(checklistItemRoutes);
app.use(linkRoutes);
export default app;

// Middleware global de tratamento de erros.
// Deve ser registrado após todas as rotas.
app.use(errorMiddleware);
