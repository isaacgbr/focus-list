export function serverAddress(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === "production";
  const value = env.PORT ?? (production ? undefined : "3000");
  const port = Number(value);
  if (!value || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT deve identificar uma porta TCP válida.");
  }
  return { port, host: production ? "0.0.0.0" : env.HOST || "127.0.0.1" };
}
