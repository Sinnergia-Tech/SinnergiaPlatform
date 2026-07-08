import crypto from "crypto";

/**
 * Token corto y firmado (HMAC con AUTH_SECRET) que transporta la identidad
 * verificada por Google hasta la pantalla de "completar registro". Va en la URL
 * del redirect que devuelve el `signIn` callback; como está firmado, el usuario
 * NO puede cambiar el email (si lo toca, la firma no valida). Vence a los 15 min.
 *
 * Node-only (usa `crypto`): se usa en `auth.ts` (signIn), en la página de
 * onboarding y en la server action — nunca en el middleware edge.
 */

const TTL_MS = 15 * 60 * 1000;

export type OnboardingIdentity = {
  email: string;
  name: string;
  image: string | null;
  sub: string; // Google account id (providerAccountId)
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no configurado");
  return s;
}

function hmac(data: string) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signOnboardingToken(identity: OnboardingIdentity): string {
  const body = { ...identity, exp: Date.now() + TTL_MS };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${data}.${hmac(data)}`;
}

export function verifyOnboardingToken(
  token: string | undefined | null
): OnboardingIdentity | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = hmac(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof body.exp !== "number" || body.exp < Date.now()) return null;
    if (!body.email) return null;
    return {
      email: String(body.email),
      name: typeof body.name === "string" ? body.name : "",
      image: typeof body.image === "string" ? body.image : null,
      sub: typeof body.sub === "string" ? body.sub : "",
    };
  } catch {
    return null;
  }
}
