import crypto from "crypto";

/**
 * Cifrado simétrico para secretos que guardamos en la DB (ej. el refresh token
 * de Google Calendar). AES-256-GCM (autenticado). La clave se deriva de
 * AUTH_SECRET, así no hace falta una env var extra. Formato: iv.tag.ciphertext
 * (los tres en base64url). Node-only.
 */

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no configurado");
  return crypto.createHash("sha256").update(s).digest(); // 32 bytes → AES-256
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB, tagB, encB] = payload.split(".");
  if (!ivB || !tagB || !encB) throw new Error("Secreto cifrado inválido");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encB, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
