import { listReports } from "@/lib/data";
import { ReportesTable } from "@/components/admin/ReportesTable";
import type { EstadoReporte } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const reports = await listReports();
  const rows = reports.map((r) => ({
    id: r.id,
    motivo: r.motivo,
    detalle: r.detalle,
    estado: r.estado as EstadoReporte,
    createdAt: r.createdAt,
    professional: r.professional
      ? {
          id: r.professional.id,
          nombre: r.professional.nombre,
          titular: r.professional.titular,
          estado: r.professional.estado,
          account: r.professional.user
            ? {
                disabled: r.professional.user.disabledAt !== null,
                deleted: r.professional.user.deletedAt !== null,
              }
            : null,
        }
      : null,
  }));
  return <ReportesTable initial={rows} />;
}
