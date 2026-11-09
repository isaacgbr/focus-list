import express, { type Request } from "express";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../../../frontend/dist/", import.meta.url));
const apiPath = /^\/(?:api|auth|health|profile|dashboard|archived|areas|lists|tasks|checklist-items|links)(?:\/|$)/;
const spaPath = /^(?:\/|\/app(?:\/.*)?|\/login|\/cadastro|\/recuperar-senha|\/redefinir-senha|\/demo(?:\/dados)?|\/sobre|\/arquivados(?:\/.*)?)\/?$/;
const legacyAreaPath = /^\/areas\/\d+(?:\/listas\/\d+)?\/?$/;

function isLegacyAreaNavigation(req: Request) {
  // /areas/:id também é API. JSON vem primeiro para manter o comportamento com Accept ausente ou */*.
  return legacyAreaPath.test(req.path) && ["GET", "HEAD"].includes(req.method) && req.accepts(["json", "html"]) === "html";
}

export const frontend = express.Router();
frontend.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (legacyAreaPath.test(req.path)) res.vary("Accept");
  if (apiPath.test(req.path) && !isLegacyAreaNavigation(req)) return next("router");
  if (!["GET", "HEAD"].includes(req.method)) return res.status(404).json({ message: "Recurso não encontrado." });
  next();
});
frontend.use(express.static(directory, {
  index: false,
  setHeaders(res, path) {
    // Só assets com hash recebem cache longo; SW, manifest e HTML precisam revalidar.
    res.setHeader("Cache-Control", /[/\\]assets[/\\]/.test(path) ? "public, max-age=31536000, immutable" : "no-cache");
  },
}));
frontend.use((req, res, next) => {
  if ((!spaPath.test(req.path) && !isLegacyAreaNavigation(req)) || /\.[^/]+$/.test(req.path)) return res.status(404).json({ message: "Recurso não encontrado." });
  res.setHeader("Cache-Control", "no-store");
  res.sendFile("index.html", { root: directory }, (error) => { if (error) next(error); });
});
