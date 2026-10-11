import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import areaRoutes from "./routes/area.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

// Permite requisições de outras origens (Frontend -> Backend).
app.use(cors());

// Permite receber JSON no corpo das requisições.
app.use(express.json());

// Rotas da aplicação.
app.use(healthRoutes);
app.use(areaRoutes);
export default app;

// Middleware global de tratamento de erros.
// Deve ser registrado após todas as rotas.
app.use(errorMiddleware);