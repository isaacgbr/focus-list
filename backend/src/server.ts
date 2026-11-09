import "dotenv/config";

import app from "./app.js";
import { serverAddress } from "./config/server.js";

const { port, host } = serverAddress();

// Inicializa o servidor HTTP.
app.listen(port, host, () => {
  console.log(`Servidor iniciado em ${host}:${port}`);
});
