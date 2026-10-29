import { randomBytes } from "node:crypto";
import demoRepository from "../repositories/demo.repository.js";
import { tokenHash } from "../security/session.js";
import { allowedBody } from "../utils/validation.js";
import { HttpError } from "../utils/http-error.js";

class DemoService {
  async start(value: unknown, previousToken?: string) {
    if (value !== undefined) allowedBody(value, []);
    const token = randomBytes(32).toString("hex");
    const result = await demoRepository.start(previousToken ? tokenHash(previousToken) : undefined, tokenHash(token));
    return { ...result, token: result.reused ? previousToken! : token };
  }

  exit(sessionId: number, userId: number, type: string, value: unknown) {
    if (value !== undefined) allowedBody(value, []);
    if (type !== "DEMO") throw new HttpError(403, "Esta ação está disponível apenas na demonstração.");
    return demoRepository.exit(sessionId, userId);
  }

  resolve(sessionId: number, userId: number, type: string, value: unknown) {
    const body = allowedBody(value, ["action"]);
    if (type !== "REAL") throw new HttpError(403, "Crie sua conta antes de escolher o destino dos dados.");
    if (body.action !== "import" && body.action !== "discard") throw new HttpError(400, "Escolha importar os dados ou começar do zero.");
    return demoRepository.resolve(sessionId, userId, body.action);
  }
}

export default new DemoService();
