import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/http-error.js";

// Middleware responsável por tratar erros da aplicação.
export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Recurso não encontrado." });
  }
  if (error && typeof error === "object" && "type" in error) {
    if (error.type === "entity.parse.failed") return res.status(400).json({ message: "JSON inválido." });
    if (error.type === "entity.too.large") return res.status(413).json({ message: "Corpo da requisição muito grande." });
  }
  // Nunca envia mensagens do Prisma, SQL, stack ou credenciais ao cliente.
  return res.status(500).json({ message: "Erro interno do servidor." });
}
