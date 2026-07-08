"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { EMAIL_NOT_VERIFIED } from "@/lib/auth-constants";

/** Server action para el formulario de login (email + contraseña). */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "");

  const ip = await getClientIp();
  const [okIp, okEmail] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, { max: 15, windowMs: 15 * 60 * 1000 }),
    checkRateLimit(`login:email:${email}`, { max: 5, windowMs: 15 * 60 * 1000 }),
  ]);
  if (!okIp || !okEmail) {
    return "Demasiados intentos. Esperá unos minutos y volvé a intentar.";
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      // Admin va a /admin; el resto pasa por /cuenta (que rutea por rol).
      redirectTo: "/cuenta",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if ((error as { code?: string }).code === "email-not-verified") {
        return EMAIL_NOT_VERIFIED;
      }
      return "Email o contraseña incorrectos.";
    }
    // signIn lanza un redirect en caso de éxito: hay que dejarlo propagar.
    throw error;
  }
}

/** Inicia el login con Google (redirige al consentimiento de Google). */
export async function signInWithGoogleAction() {
  // signIn lanza un redirect (a Google, y luego de vuelta): dejarlo propagar.
  await signIn("google", { redirectTo: "/cuenta" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
