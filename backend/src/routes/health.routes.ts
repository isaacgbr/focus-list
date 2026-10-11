import { Router } from "express";

const router = Router();

// Rota utilizada para verificar se a API está disponível.
router.get("/health", (_, res) => {
  res.status(200).json({
    status: "OK",
    message: "FocusList API funcionando.",
  });
});

export default router;