import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccountFlags } from "@/lib/data";
import type { Session } from "next-auth";

/**
 * Enforcement de estado de cuenta en rutas privadas.
 *
 * Cubre el punto ciego de las sesiones JWT (no se revocan solas: viven hasta
 * 30 días aunque la cuenta se deshabilite o elimine). Hace una query liviana
 * por id en cada request privado:
 *  - sin sesión / cuenta eliminada → a /login (la sesión ya no corresponde).
 *  - deshabilitada manualmente → devuelve `disabled: true` para que la página
 *    decida (mostrar la pantalla de reactivar en /cuenta, o redirigir a /cuenta
 *    desde el resto).
 */
export async function requireAccount(): Promise<{
  session: Session;
  disabled: boolean;
  disabledByAdmin: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const flags = await getAccountFlags(session.user.id);
  if (!flags || flags.deletedAt) redirect("/login");

  return {
    session,
    disabled: !!flags.disabledAt,
    disabledByAdmin: !!flags.disabledByAdmin,
  };
}
