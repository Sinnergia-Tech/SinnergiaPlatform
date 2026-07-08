import crypto from "crypto";

/**
 * Cliente mínimo de Google Calendar vía REST (sin dependencias nuevas). Se usa
 * para el "calendario compartido del estudio": una sola cuenta de Google se
 * conecta con acceso offline y guardamos su refresh token; con eso creamos
 * eventos con Meet. Node-only.
 *
 * Reutiliza el MISMO OAuth client que el login (GOOGLE_CLIENT_ID/SECRET) — sólo
 * hay que agregar el scope `calendar.events` y la redirect URI del callback de
 * calendario en Google Cloud.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

// calendar.events = crear/editar eventos; openid/email/profile = saber qué cuenta se conectó.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
].join(" ");

function baseUrl() {
  return (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

/** Redirect URI del callback de calendario (agregar en Google Cloud). */
export function calendarRedirectUri() {
  return `${baseUrl()}/api/google-calendar/callback`;
}

// --- State firmado (anti-CSRF del flujo OAuth) -------------------------------

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no configurado");
  return s;
}

export function signState(): string {
  const body = Buffer.from(
    JSON.stringify({ n: crypto.randomBytes(8).toString("hex"), exp: Date.now() + 10 * 60 * 1000 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state: string | null): boolean {
  if (!state) return false;
  const dot = state.indexOf(".");
  if (dot < 0) return false;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof exp === "number" && exp >= Date.now();
  } catch {
    return false;
  }
}

// --- OAuth -------------------------------------------------------------------

export function calendarAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: calendarRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // para recibir refresh_token
    prompt: "consent", // fuerza el refresh_token aunque ya haya consentido
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: calendarRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange falló: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh falló: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as TokenResponse;
  return data.access_token;
}

export async function getConnectedEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

// --- Eventos -----------------------------------------------------------------

// Argentina no usa horario de verano: offset fijo -03:00 (evita depender de una
// librería de timezones). Si algún día se opera en otra zona, revisar esto.
export const TIMEZONE = "America/Argentina/Buenos_Aires";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";

export type CreatedEvent = {
  id: string;
  meetUrl: string | null;
  htmlLink: string | null;
};

/**
 * Crea un evento con Google Meet e invita a los `attendees`. `sendUpdates=all`
 * hace que Google mande la invitación por mail. Requiere un access token válido
 * de la cuenta del estudio (ver `refreshAccessToken`).
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  input: {
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    attendeeEmails: string[];
  }
): Promise<CreatedEvent> {
  const body = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startISO, timeZone: TIMEZONE },
    end: { dateTime: input.endISO, timeZone: TIMEZONE },
    attendees: input.attendeeEmails.filter(Boolean).map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };
  const url = `${CALENDAR_API}/${encodeURIComponent(
    calendarId
  )}/events?conferenceDataVersion=1&sendUpdates=all`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Google Calendar insert falló: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  };
  const meetUrl =
    data.hangoutLink ??
    data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
    null;
  return { id: data.id, meetUrl, htmlLink: data.htmlLink ?? null };
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `${CALENDAR_API}/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(
    eventId
  )}?sendUpdates=all`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 = ya estaba borrado; lo tomamos como éxito.
  if (!res.ok && res.status !== 410) {
    throw new Error(`Google Calendar delete falló: ${res.status} ${await res.text()}`);
  }
}
