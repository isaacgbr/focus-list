import { attachDatabasePool, waitUntil } from "@vercel/functions";
import app from "../app.js";
import { pool } from "./prisma.js";

attachDatabasePool(pool);
app.locals.waitUntil = waitUntil;

export default app;
