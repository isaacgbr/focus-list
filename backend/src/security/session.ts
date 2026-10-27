import { createHash } from "node:crypto";
import type { CookieOptions, Request } from "express";

export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
export const cookieName = process.env.NODE_ENV === "production" ? "__Host-focuslist_session" : "focuslist_session";
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function sessionToken(req: Request): string | undefined {
  const values = (req.headers.cookie ?? "").split(";")
    .map((part) => part.trim()).filter((part) => part.startsWith(`${cookieName}=`));
  if (values.length !== 1) return undefined;
  const token = values[0].slice(cookieName.length + 1);
  return /^[0-9a-f]{64}$/.test(token) ? token : undefined;
}

export function tokenHash(token: string) {
  // SHA-256 é usado apenas para tokens aleatórios de 256 bits, nunca para senhas.
  return createHash("sha256").update(token).digest("hex");
}
