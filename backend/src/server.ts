import "dotenv/config";

import app from "./app.js";

const PORT = process.env.PORT || 3000;

// Inicializa o servidor HTTP.
// Restrito ao computador local; exposição pública exige revisão de HTTPS/proxy e limitação de abuso.
app.listen(Number(PORT), "127.0.0.1", () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
