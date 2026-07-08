"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";
import { disableUser, reactivateUser, softDeleteUser, getAccountFlags } from "@/lib/data";

type Result = { ok: boolean; error?: string };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** El usuario se oculta a propósito (deshabilitación manual). */
export async function disableOwnAccountAction(): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "No autenticado" };
  await disableUser(userId);
  revalidatePath("/cuenta");
  return { ok: true };
}

/** Reactivación explícita tras una baja manual. */
export async function reactivateOwnAccountAction(): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "No autenticado" };
  // Una suspensión hecha por el admin NO se puede levantar sola.
  const flags = await getAccountFlags(userId);
  if (flags?.disabledByAdmin) {
    return {
      ok: false,
      error: "Tu cuenta fue suspendida por el equipo de Sinnergia. Escribinos para revisarlo.",
    };
  }
  await reactivateUser(userId);
  revalidatePath("/cuenta");
  return { ok: true };
}

/** Soft-delete + anonimización. Cierra la sesión y vuelve al inicio. */
export async function deleteOwnAccountAction(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await softDeleteUser(userId);
  await signOut({ redirectTo: "/" });
}

/** Cambio de contraseña estando logueado (requiere la contraseña actual). */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: "Las contraseñas nuevas no coinciden" };
  }
  if (!isPasswordValid(input.newPassword)) {
    return { ok: false, error: PASSWORD_HINT };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "No autenticado" };
  if (!user.passwordHash) {
    return {
      ok: false,
      error:
        "Tu cuenta entra con Google y no tiene contraseña. Para crear una, usá “¿Olvidaste tu contraseña?”.",
    };
  }

  const ok = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "La contraseña actual es incorrecta" };

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}
