import { randomUUID } from "node:crypto";
import { HttpError } from "../utils/http-error.js";
const unavailable = () => new HttpError(503, "Não foi possível acessar a foto de perfil. Tente novamente.");
async function request(key: string, method: "GET" | "POST" | "DELETE", image?: Buffer) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/.test(key)) throw new HttpError(404, "Foto não encontrada.");
  try {
    const origin = new URL(process.env.SUPABASE_URL ?? "");
    const secret = process.env.SUPABASE_SECRET_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/" || !secret || !bucket || !/^[a-zA-Z0-9_-]+$/.test(bucket)) throw unavailable();
    const headers: Record<string, string> = { apikey: secret };
    if (secret.startsWith("eyJ")) headers.Authorization = `Bearer ${secret}`;
    if (image) { headers["Content-Type"] = "image/jpeg"; headers["x-upsert"] = "false"; }
    const path = method === "GET" ? "object/authenticated" : "object";
    const response = await fetch(new URL(`/storage/v1/${path}/${encodeURIComponent(bucket)}/${key}`, origin), {
      method, headers, body: image ? new Uint8Array(image) : undefined,
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      // Storage também representa objeto ausente como HTTP 400 + statusCode 404.
      const detail = await response.json().catch(() => null);
      const missing = response.status === 404 || (response.status === 400 && (String(detail?.statusCode) === "404" || detail?.code === "NoSuchKey"));
      if (missing && method === "GET") throw new HttpError(404, "Foto não encontrada.");
      if (missing && method === "DELETE") return null;
      throw unavailable();
    }
    if (method === "GET") return Buffer.from(await response.arrayBuffer());
    await response.body?.cancel();
    return null;
  } catch (error) {
    // Não propaga URL, corpo, credencial ou mensagem do provedor.
    if (error instanceof HttpError && error.status === 404) throw error;
    throw unavailable();
  }
}
class AvatarRepository {
  async save(image: Buffer) { const key = `${randomUUID()}.jpg`; await request(key, "POST", image); return key; }
  async read(key: string) { return (await request(key, "GET"))!; }
  async remove(key: string | null) { if (key) await request(key, "DELETE"); }
}
export default new AvatarRepository();
