/**
 * Medidas de seguridad de contenido cargado por usuarios.
 *
 * Tres capas, todas server-side (nunca confiar en la validación del cliente):
 *  1. Pin de imágenes: una URL de imagen que guardamos como <img src> tiene que
 *     ser de NUESTRO storage (Vercel Blob). Cierra la inyección de imágenes
 *     externas (hotlink, pixel de tracking, contenido ajeno) vía requests crafteados.
 *  2. Filtro de texto: baseline de palabras prohibidas + señales de spam.
 *  3. Chequeo de URLs: esquema/host peligroso (bloqueado siempre) + Google Safe
 *     Browsing si hay API key (degradado elegante: sin key, solo el blocklist local).
 *
 * Todas las funciones devuelven `string | null`: el string es un mensaje de error
 * en es-AR listo para mostrar; `null` significa "pasó". Mismo contrato que
 * checkImageFile en image-constraints.ts.
 */

// --- 1. Pin de imágenes al storage propio -----------------------------------

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** ¿La URL es una imagen alojada en nuestro Vercel Blob? */
export function isBlobImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Valida que una imagen cargada por el usuario venga de nuestro storage.
 * `null`/vacío es válido (imagen opcional). Cualquier host externo se rechaza.
 */
export function checkBlobImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!isBlobImageUrl(url)) {
    return "La imagen no es válida. Subila desde el formulario en lugar de pegar un link.";
  }
  return null;
}

// --- 2. Filtro de texto ------------------------------------------------------

/**
 * Baseline de términos prohibidos (odio/acoso explícito). Deliberadamente corto
 * y conservador para no bloquear texto legítimo; se itera. La comparación es
 * insensible a mayúsculas y acentos, con límites de palabra.
 */
const BLOCKED_WORDS = [
  // Insultos/odio (es). Ampliar con criterio — evitar falsos positivos.
  "puto",
  "putos",
  "puta",
  "putas",
  "negro de mierda",
  "negros de mierda",
  "sudaca",
  "sudacas",
  "villero de mierda",
  "mogolico",
  "mogólico",
  "retrasado mental",
  // Slurs (en)
  "nigger",
  "faggot",
  "retard",
];

/** Combining diacritics (U+0300–U+036F), sin literales en el fuente. */
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** Normaliza para comparar: minúsculas, sin acentos. */
function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICS, "");
}

const URL_IN_TEXT = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ar|xyz|info|biz)\b/gi;

/**
 * Valida un texto libre cargado por el usuario.
 * - `field`: nombre del campo para el mensaje ("La descripción", "El título"…).
 * - `maxUrls`: máximo de URLs toleradas dentro del texto (spam). Default 2;
 *   pasá 0 para prohibirlas (ej. nombre, titular).
 */
export function checkText(
  text: string,
  { field = "El texto", maxUrls = 2 }: { field?: string; maxUrls?: number } = {}
): string | null {
  const folded = fold(text);
  for (const word of BLOCKED_WORDS) {
    const w = fold(word);
    // Límite de palabra manual (unicode-safe): que no esté pegado a letras/números.
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(w)}([^\\p{L}\\p{N}]|$)`, "u");
    if (re.test(folded)) {
      return `${field} contiene lenguaje que no está permitido en la plataforma.`;
    }
  }
  const urls = text.match(URL_IN_TEXT);
  if (urls && urls.length > maxUrls) {
    return maxUrls === 0
      ? `${field} no puede contener links.`
      : `${field} tiene demasiados links. Dejá los links en los campos correspondientes.`;
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- 3. Chequeo de URLs ------------------------------------------------------

/**
 * Hosts/patrones bloqueados siempre (independiente de Safe Browsing). Cubre
 * loopback y rangos privados (SSRF/redirecciones internas) — no tiene sentido
 * que un link "externo" apunte ahí. Ampliable con dominios conocidos maliciosos.
 */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) return true;
  // IPs privadas / link-local IPv4
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  return false;
}

/**
 * Chequea que una URL externa (ya normalizada con normalizeExternalUrl) sea
 * segura para guardar y enlazar. Devuelve mensaje de error o null.
 *
 * Con GOOGLE_SAFE_BROWSING_API_KEY seteada, además consulta la Lookup API de
 * Google (malware/phishing/unwanted software). Sin key, solo corre el blocklist
 * local. Ante error de red o timeout: fail-open (no bloqueamos a un usuario
 * legítimo por una API caída), pero los checks locales ya cortaron lo obvio.
 */
export async function checkUrlSafe(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "El link no parece una URL válida.";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "El link tiene que empezar con http:// o https://";
  }
  if (isPrivateHost(parsed.hostname)) {
    return "Ese link no está permitido.";
  }

  const flagged = await googleSafeBrowsingFlags(url);
  if (flagged) {
    return "Ese link fue marcado como peligroso (malware o phishing) y no se puede usar.";
  }
  return null;
}

/** True si Google Safe Browsing marca la URL como amenaza. Fail-open. */
async function googleSafeBrowsingFlags(url: string): Promise<boolean> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) return false;

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`;
  const body = {
    client: { clientId: "sinnergia-platform", clientVersion: "1.0.0" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return false; // fail-open
    const data = (await res.json()) as { matches?: unknown[] };
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    return false; // timeout / red caída → no bloqueamos
  }
}
