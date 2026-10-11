import { NextFunction, Request, Response } from "express";

// Middleware responsável por tratar erros da aplicação.
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  return res.status(400).json({
    message: error.message,
  });
}