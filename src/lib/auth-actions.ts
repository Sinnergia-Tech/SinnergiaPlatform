"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

/** Server action para el formulario de login (email + contraseña). */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Admin va a /admin; el resto pasa por /cuenta (que rutea por rol).
      redirectTo: "/cuenta",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email o contraseña incorrectos.";
    }
    // signIn lanza un redirect en caso de éxito: hay que dejarlo propagar.
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
