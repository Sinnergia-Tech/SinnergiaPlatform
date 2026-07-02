import Link from "next/link";
import {
  StatCard,
  Card,
  Badge,
  estadoVariant,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getDashboardData } from "@/lib/data";
import { ESTADO_PROFESIONAL_LABEL, ESTADO_LEAD_LABEL } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { stats, pendientes, ultimosDiagnosticos, colaMatches } =
    await getDashboardData();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Resumen de la operación de Sinnergia."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={stats.profesionalesPendientes} label="Profesionales pendientes" sub="Esperando moderación" />
        <StatCard value={stats.profesionalesAprobados} label="Profesionales aprobados" sub={`de ${stats.profesionalesTotal} totales`} />
        <StatCard value={stats.diagnosticosNuevos} label="Diagnósticos nuevos" sub={`de ${stats.diagnosticosTotal} totales`} />
        <StatCard value={stats.matchesEnGestion} label="Matches en gestión" sub={`${stats.matchesCerrados} cerrados`} />
      </div>

      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
            Umbral de validación del modelo
          </h2>
          <span className="text-xs text-ink/40">objetivo del brief</span>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Progress label="Profesionales" value={stats.profesionalesTotal} goal={50} />
          <Progress label="Diagnósticos / mes" value={stats.diagnosticosTotal} goal={10} />
          <Progress label="Matches" value={stats.matchesTotal} goal={4} />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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

      <Card className="mt-4">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold">Cola de matches</h2>
          <Link href="/admin/matches" className="link-underline text-sm text-ink/60 hover:text-ink">
            Gestionar
          </Link>
        </div>
        <ul>
          {colaMatches.length === 0 && (
            <li className="px-6 py-5 text-sm text-ink/45">Sin matches en cola.</li>
          )}
          {colaMatches.map((m) => (
            <li key={m.id} className="flex items-center justify-between border-b border-ink/5 px-6 py-4 last:border-0">
              <div>
                <span className="font-medium">{m.company?.nombre}</span>
                <div className="text-sm text-ink/50">{m.contexto}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink/45">{m.candidatos.length} candidatos</span>
                <Badge variant={estadoVariant(m.estado)}>
                  {m.estado === "en_gestion" ? "En gestión" : "Solicitado"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Progress({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink/60">{label}</span>
        <span className="text-sm font-medium">
          {value}
          <span className="text-ink/35"> / {goal}</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-ash">
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
