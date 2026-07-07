/**
 * Normaliza un link externo cargado por el usuario a una URL segura.
 * - Ya con http(s):// → se deja igual.
 * - "dominio.com/loquesea" → se le antepone https://.
 * - Cualquier cosa que no parezca una URL (ej. "prueba") → null (no se enlaza).
 *
 * Evita el bug de navegar a un href inválido (que rompía con 400).
 */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  // Parece un dominio: algo.algo, sin espacios.
  if (/^[^\s./]+(\.[^\s./]+)+(\/[^\s]*)?$/.test(s)) return `https://${s}`;
  return null;
}
