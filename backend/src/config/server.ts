export function serverAddress(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  const value = env.PORT ?? (production ? undefined : "3000");
  const port = Number(value);
  if (!value || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT deve identificar uma porta TCP válida.");
  }
  return { port, host: production ? "0.0.0.0" : env.HOST || "127.0.0.1" };
}

export function trustedProxy(env: NodeJS.ProcessEnv = process.env) {
  // Render termina TLS no proxy imediatamente anterior. Não confiar em toda a cadeia XFF.
  // Rever este limite caso a topologia passe a ter outros caminhos/proxies de entrada.
  return env.NODE_ENV === "production" && env.RENDER === "true" ? 1 : false;
}
