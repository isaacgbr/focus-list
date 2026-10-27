import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { HttpError } from "../utils/http-error.js";

// OWASP: scrypt N=2^17, r=8, p=1 (128 MiB). Sem dependência adicional.
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
let active = 0;

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  // Limita o consumo simultâneo de memória; não cria fila ilimitada.
  if (active >= 2) throw new HttpError(503, "Autenticação ocupada. Tente novamente.");
  active++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, options, (error, key) => error ? reject(error) : resolve(key));
    });
  } finally {
    active--;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$131072$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

// Mesmo trabalho criptográfico para conta ausente ou senha incorreta.
const dummy = `scrypt$131072$8$1$${randomBytes(16).toString("hex")}$${randomBytes(64).toString("hex")}`;

export async function verifyPassword(password: string, stored: string | null | undefined) {
  const encoded = stored ?? dummy;
  const valid = /^scrypt\$131072\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(encoded);
  const parts = (valid ? encoded : dummy).split("$");
  const key = await derive(password, Buffer.from(parts[4], "hex"));
  return timingSafeEqual(key, Buffer.from(parts[5], "hex")) && valid && !!stored;
}
