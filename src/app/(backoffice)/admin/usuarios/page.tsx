import { listAccounts } from "@/lib/data";
import { UsuariosTable } from "@/components/admin/UsuariosTable";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const accounts = await listAccounts();
  const rows = accounts.map((u) => ({
    userId: u.id,
    nombre: u.nombre,
    email: u.email,
    role: u.role as string,
    emailVerified: u.emailVerified !== null,
    disabledAt: u.disabledAt?.toISOString() ?? null,
    deletedAt: u.deletedAt?.toISOString() ?? null,
    lastLoginAt: u.lastLoginAt.toISOString(),
    href: u.professionalId
      ? `/admin/profesionales/${u.professionalId}`
      : u.companyId
        ? `/admin/empresas/${u.companyId}`
        : null,
  }));
  return <UsuariosTable initial={rows} />;
}
