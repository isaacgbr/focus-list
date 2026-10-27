import { HttpError } from "./http-error.js";

export function allowedBody(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Envie um objeto JSON válido.");
  }
  if (Object.keys(value).some((key) => !fields.includes(key))) {
    throw new HttpError(400, "O corpo contém campos não permitidos.");
  }
  return value as Record<string, unknown>;
}

export function positiveId(value: unknown): number {
  const id = typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : value;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
    throw new HttpError(400, "ID inválido.");
  }
  return id;
}

// Valida tipos antes de entregar um DTO explícito aos serviços existentes.
export function domainBody(value: unknown, fields: readonly string[], required: readonly string[] = []) {
  const body = allowedBody(value, fields);
  const data: Record<string, unknown> = {};
  for (const key of required) {
    if (body[key] === undefined) throw new HttpError(400, `O campo ${key} é obrigatório.`);
  }
  for (const [key, item] of Object.entries(body)) {
    if (item === null && ["description", "color", "icon", "dueDate", "priority", "completedAt"].includes(key)) data[key] = null;
    else if (key.endsWith("Id")) data[key] = positiveId(item);
    else if (key === "completed") {
      if (typeof item !== "boolean") throw new HttpError(400, "Conclusão inválida.");
      data[key] = item;
    } else if (key === "priority") {
      if (!["LOW", "MEDIUM", "HIGH"].includes(item as string)) throw new HttpError(400, "Prioridade inválida.");
      data[key] = item;
    } else if (key === "dueDate" || key === "completedAt") {
      if (typeof item !== "string" || !Number.isFinite(Date.parse(item))) throw new HttpError(400, "Data inválida.");
      // Entrega ao Prisma um Date válido, inclusive quando o cliente envia só AAAA-MM-DD.
      data[key] = new Date(item);
    } else {
      if (typeof item !== "string" || item.length > 10000 || /\u0000/.test(item)) {
        throw new HttpError(400, `O campo ${key} é inválido.`);
      }
      data[key] = item;
    }
  }
  return data;
}
