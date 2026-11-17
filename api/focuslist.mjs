import app from "../backend/dist/app.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // A API atual usa caminhos como /auth e /areas. /api ainda não tem rotas públicas.
  if (/^\/api(?:[/?]|$)/i.test(req.url ?? "")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Recurso não encontrado." }));
    return;
  }

  app(req, res);
}
