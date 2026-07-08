import Link from "next/link";
import { Card, Badge, estadoVariant, AdminPageHeader } from "@/components/admin/ui";
import { AnalyticsSection } from "@/components/admin/Analytics";
import { getDashboardData, getAnalyticsData } from "@/lib/data";
import { ESTADO_PROFESIONAL_LABEL, ESTADO_LEAD_LABEL } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [{ stats, pendientes, ultimosDiagnosticos }, analytics] = await Promise.all([
    getDashboardData(),
    getAnalyticsData(),
  ]);

  const dbMb = analytics.db.bytes / (1024 * 1024);
  const dbAlerta = analytics.db.alertMb !== null && dbMb >= analytics.db.alertMb;

  return (
    <>
      <AdminPageHeader
        title="Analíticas"
        subtitle="Resumen de la operación de Sinnergia."
      />

      {stats.diagnosticosNuevos > 0 && (
        <Link
          href="/admin/empresas?estado=nuevo"
          className="mb-4 flex items-center justify-between border border-ink bg-ink px-5 py-3 text-sm text-paper transition-opacity hover:opacity-90"
        >
          <span>
            ✉ {stats.diagnosticosNuevos} empresa(s) esperando una sesión de consulta.
          </span>
          <span className="text-xs uppercase tracking-[0.1em]">Ver solicitudes →</span>
        </Link>
      )}

      {dbAlerta && (
        <div className="mb-4 flex items-center justify-between border border-ink bg-paper px-5 py-3 text-sm text-ink">
          <span>
            ⚠ La base pesa {dbMb.toFixed(1)} MB y superó el umbral de alerta
            ({analytics.db.alertMb} MB). Revisá el plan de Supabase o la limpieza de datos.
          </span>
        </div>
      )}

      {analytics.reportsPendientes > 0 && (
        <Link
          href="/admin/reportes"
          className="mb-4 flex items-center justify-between border border-ink bg-ink px-5 py-3 text-sm text-paper transition-opacity hover:opacity-90"
        >
          <span>
            ⚑ Tenés {analytics.reportsPendientes} reporte(s) de contenido sin revisar.
          </span>
          <span className="text-xs uppercase tracking-[0.1em]">Revisar →</span>
        </Link>
      )}

      <AnalyticsSection data={analytics} />

      <div className="mt-8 mb-3 flex items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Operación</h2>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
            <h2 className="font-semibold">Pendientes de aprobación</h2>
            <Link href="/admin/profesionales" className="link-underline text-sm text-ink/60 hover:text-ink">
              Ver todos
            </Link>
          </div>
          <ul>
            {pendientes.length === 0 && (
              <li className="px-6 py-5 text-sm text-ink/45">Nada pendiente.</li>
            )}
            {pendientes.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-ink/5 px-6 py-4 last:border-0">
                <div>
                  <Link href={`/admin/profesionales/${p.id}`} className="font-medium hover:underline">
                    {p.nombre}
                  </Link>
                  <div className="text-sm text-ink/50">{p.titular}</div>
                </div>
                <Badge variant={estadoVariant(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
            <h2 className="font-semibold">Últimos diagnósticos</h2>
            <Link href="/admin/empresas" className="link-underline text-sm text-ink/60 hover:text-ink">
              Ver todos
            </Link>
          </div>
          <ul>
            {ultimosDiagnosticos.map((d) => (
              <li key={d.id} className="flex items-center justify-between border-b border-ink/5 px-6 py-4 last:border-0">
                <div>
                  <Link href={`/admin/empresas/${d.companyId}`} className="font-medium hover:underline">
                    {d.company?.nombre}
                  </Link>
                  <div className="text-sm text-ink/50">{d.rubro} · {d.presupuesto}</div>
                </div>
                <Badge variant={estadoVariant(d.estadoLead)}>{ESTADO_LEAD_LABEL[d.estadoLead]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
