import { randomBytes, createHash } from "crypto";

/** Genera un token random; sólo el hash se persiste en la DB. */
export function generateToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
