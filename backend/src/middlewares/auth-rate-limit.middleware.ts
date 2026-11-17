import type { RequestHandler } from "express";
import { isIP } from "node:net";

// Proteção básica local. Exposição pública exige limitador compartilhado no proxy.
const attempts = new Map<string, { count: number; until: number }>();
export const authRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  // Na Vercel, o cabeçalho da plataforma informa o IP do cliente sem confiar na cadeia XFF.
  const edgeIp = process.env.VERCEL === "1" ? req.get("x-vercel-forwarded-for") : undefined;
  const key = edgeIp && isIP(edgeIp) ? edgeIp : req.ip ?? "unknown";
  let entry = attempts.get(key);
  if (!entry) {
    if (attempts.size >= 10000) return res.status(429).json({ message: "Tente novamente mais tarde." });
    entry = { count: 0, until: now + 15 * 60 * 1000 };
    attempts.set(key, entry);
  }
  if (++entry.count > 30) {
    res.setHeader("Retry-After", Math.ceil((entry.until - now) / 1000));
    return res.status(429).json({ message: "Tente novamente mais tarde." });
  }
  next();
};
