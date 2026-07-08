import { Card, StatCard } from "@/components/admin/ui";
import type { AnalyticsData } from "@/lib/data";

/**
 * Sección de analíticas del dashboard. Server component, sin interactividad.
 * Estética monocromática (regla de marca): barras en `ink`, pistas en `ash`,
 * jerarquía por grises. Sin color.
 */

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">{title}</h2>
        {hint && <span className="text-xs text-ink/40">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}

/** Lista de barras horizontales etiquetadas (comparten la misma escala). */
function BarList({
  rows,
  emptyLabel = "Sin datos todavía.",
}: {
  rows: { label: string; value: number }[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (total === 0) return <p className="text-sm text-ink/45">{emptyLabel}</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-ink/70">{r.label}</span>
            <span className="font-medium">
              {r.value}
              <span className="ml-1 text-xs text-ink/35">{pct(r.value, total)}%</span>
            </span>
          </div>
          <div className="h-1.5 w-full bg-ash">
            <div
              className="h-full bg-ink"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Barras verticales apiladas por mes (freelancer + empresa), ventana móvil de 12
 * meses. Muestra el año bajo la primera barra y cada vez que cambia, para leer el
 * rendimiento anual sin ambigüedad. Scrollea en horizontal si no entra.
 */
function MonthlyBars({ data }: { data: AnalyticsData["monthly"] }) {
  const max = Math.max(1, ...data.map((m) => m.total));
  const h = (n: number) => (n / max) * 120;
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[540px] items-end gap-2" style={{ height: 150 }}>
          {data.map((m, i) => {
            const showYear = i === 0 || m.year !== data[i - 1].year;
            return (
              <div key={`${m.year}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-ink/70">{m.total || ""}</span>
                <div
                  className="flex w-full max-w-[40px] flex-col justify-end"
                  style={{ height: 120 }}
                  title={`${m.label} ${m.year}: ${m.freelancer} freelancers, ${m.empresa} empresas`}
                >
                  <div className="w-full bg-ink/45" style={{ height: h(m.empresa) }} />
                  <div className="w-full bg-ink" style={{ height: h(m.freelancer) }} />
                </div>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-xs uppercase tracking-[0.06em] text-ink/45">{m.label}</span>
                  <span className={`mt-0.5 text-[0.6rem] ${showYear ? "text-ink/35" : "text-transparent"}`}>
                    {m.year}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-ink/50">
        <Legend swatch="bg-ink" label="Freelancers" />
        <Legend swatch="bg-ink/45" label="Empresas" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 ${swatch}`} />
      {label}
    </span>
  );
}

export function AnalyticsSection({ data }: { data: AnalyticsData }) {
  const { usersByRole, lifecycle, activity, moderacion, empresas, demanda, monthly, db } = data;

  // Embudo: qué fracción de diagnósticos derivó en una sesión agendada.
  const convDiagASesion = pct(empresas.sesiones, empresas.diagnosticos);
  const convContactos = pct(empresas.contactosRespondidos, empresas.contactosTotal);

  return (
    <>
      {/* KPIs principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          value={activity.usuariosTotal}
          label="Usuarios registrados"
          sub={`${usersByRole.freelancer} freelancers · ${usersByRole.empresa} empresas`}
        />
        <StatCard
          value={activity.nuevos30d}
          label="Nuevos (30 días)"
          sub="cuentas creadas"
        />
        <StatCard
          value={activity.activos30d}
          label="Activos (30 días)"
          sub={`${pct(activity.activos30d, activity.usuariosTotal)}% · ${activity.activos7d} en 7 días`}
        />
        <StatCard
          value={empresas.sesiones}
          label="Sesiones agendadas"
          sub="con empresas"
        />
      </div>

      {/* Usuarios + registros por mes */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Composición de usuarios" hint={`${activity.usuariosTotal} usuarios`}>
          <BarList
            rows={[
              { label: "Freelancers", value: usersByRole.freelancer },
              { label: "Empresas", value: usersByRole.empresa },
            ]}
          />
          <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-ink/45">
            {activity.verificados}/{activity.usuariosTotal} con email verificado
          </p>
        </SectionCard>

        <SectionCard title="Registros por mes" hint="últimos 6 meses">
          <MonthlyBars data={monthly} />
        </SectionCard>
      </div>

      {/* Moderación + ciclo de vida */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Moderación de perfiles" hint={`${moderacion.total} en total`}>
          <BarList
            rows={[
              { label: "Aprobados", value: moderacion.aprobado },
              { label: "Pendientes", value: moderacion.pendiente },
              { label: "Rechazados", value: moderacion.rechazado },
              { label: "Ocultos", value: moderacion.oculto },
            ]}
          />
          <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-ink/45">
            {moderacion.destacados} perfil(es) destacado(s) ·{" "}
            {moderacion.avgAprobacionDias !== null
              ? `${moderacion.avgAprobacionDias.toFixed(1)} días promedio de aprobación (${moderacion.medidos})`
              : "sin aprobaciones medidas todavía"}
          </p>
        </SectionCard>

        <SectionCard title="Ciclo de vida de cuentas">
          <BarList
            rows={[
              { label: "Activas", value: lifecycle.activas },
              { label: "Inactivas (+30 días)", value: lifecycle.inactivas },
              { label: "Deshabilitadas", value: lifecycle.deshabilitadas },
              { label: "Eliminadas", value: lifecycle.eliminadas },
            ]}
          />
        </SectionCard>
      </div>

      {/* Empresas / embudo + base de datos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Embudo de empresas">
          <BarList
            rows={[
              { label: "Diagnósticos", value: empresas.diagnosticos },
              { label: "Sesiones agendadas", value: empresas.sesiones },
              { label: "Contactos enviados", value: empresas.contactosTotal },
            ]}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-3">
            <Conversion label="Diagnóstico → sesión" value={convDiagASesion} />
            <Conversion label="Contactos respondidos" value={convContactos} />
          </div>
          <p className="mt-3 text-xs text-ink/45">
            {activity.diagnosticos30d} diagnósticos en los últimos 30 días
          </p>
        </SectionCard>

        <SectionCard title="Rubros más demandados" hint="por diagnóstico">
          <BarList rows={demanda.rubros} emptyLabel="Sin diagnósticos todavía." />
        </SectionCard>
      </div>

      {/* Base de datos */}
      <div className="mt-4">
        <SectionCard title="Base de datos" hint="Supabase · en vivo">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-4xl font-light tracking-[-0.02em]">
                {formatBytes(db.bytes)}
              </div>
              <p className="mt-2 text-sm font-medium">Tamaño total de la base</p>
              <p className="mt-0.5 text-xs text-ink/45">
                Consultado en tiempo real a Postgres (pg_database_size).
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-ink/40">Tablas más pesadas</p>
              {db.tablas.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {db.tablas.map((t) => {
                    const share = db.bytes ? Math.round((t.bytes / db.bytes) * 100) : 0;
                    return (
                      <li key={t.tabla}>
                        <div className="flex items-center justify-between">
                          <span className="text-ink/70">{t.tabla}</span>
                          <span className="tabular-nums text-ink/50">{formatBytes(t.bytes)}</span>
                        </div>
                        <div className="mt-1 h-1 w-full bg-ash">
                          <div className="h-full bg-ink" style={{ width: `${Math.max(2, share)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink/45">Sin datos de tablas.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function Conversion({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-light tracking-[-0.02em]">{value}%</div>
      <div className="mt-0.5 text-xs text-ink/50">{label}</div>
    </div>
  );
}

function formatBytes(bytes: number) {
  const GB = 1024 ** 3;
  const MB = 1024 ** 2;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
