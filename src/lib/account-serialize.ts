import type { AccountInfo } from "@/components/admin/AdminAccountPanel";

/**
 * Convierte la cuenta de la DB (con Dates) al shape serializable que espera el
 * panel de cuenta del admin (fechas como ISO). Devuelve null si no hay cuenta.
 */
export function serializeAccount(
  account:
    | {
        id: string;
        email: string;
        emailVerified: Date | null;
        disabledAt: Date | null;
        deletedAt: Date | null;
        lastLoginAt: Date;
      }
    | null
): AccountInfo {
  if (!account) return null;
  return {
    userId: account.id,
    email: account.email,
    emailVerified: account.emailVerified !== null,
    disabledAt: account.disabledAt?.toISOString() ?? null,
    deletedAt: account.deletedAt?.toISOString() ?? null,
    lastLoginAt: account.lastLoginAt.toISOString(),
  };
}
