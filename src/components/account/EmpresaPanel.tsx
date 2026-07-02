import { Badge, estadoVariant } from "@/components/admin/ui";
import { ESTADO_LEAD_LABEL, ESTADO_MATCH_LABEL } from "@/lib/catalogs";
import type { EstadoLead, EstadoMatch } from "@/lib/types";

type Diag = {
  id: string;
  objetivos: string;
  problemaPrincipal: string;
  presupuesto: string;
  estadoLead: EstadoLead;
};

type Match = {
  id: string;
  contexto: string;
  estado: EstadoMatch;
  resultado: string | null;
  candidatos: { seleccionado: boolean }[];
};

type Company = {
  nombre: string;
  rubro: string;
  diagnoses: Diag[];
  matches: Match[];
};

export function EmpresaPanel({ company }: { company: Company | null }) {
  if (!company) return <p className="text-ink/50">No encontramos tu empresa.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-ink/40">Tu cuenta</p>
          <h1 className="mt-2 text-2xl font-semibold">{company.nombre}</h1>
          <p className="text-sm text-ink/50">{company.rubro}</p>
        </div>
        <a
          href="/diagnostico"
          className="group inline-flex items-center gap-2 bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85"
        >
          Nuevo diagnóstico
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
      </div>

      <section className="border border-ink/10 bg-paper">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold">Tus diagnósticos</h2>
        </div>
        <ul>
          {company.diagnoses.length === 0 && (
            <li className="px-6 py-6 text-sm text-ink/45">Todavía no completaste un diagnóstico.</li>
          )}
          {company.diagnoses.map((d) => (
            <li key={d.id} className="border-b border-ink/5 px-6 py-5 last:border-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-xl">
                  <div className="text-sm text-ink/45">Objetivos</div>
                  <p className="mt-0.5 text-ink/85">{d.objetivos}</p>
                  <p className="mt-2 text-sm text-ink/55">{d.problemaPrincipal}</p>
                </div>
                <div className="text-right">
                  <Badge variant={estadoVariant(d.estadoLead)}>{ESTADO_LEAD_LABEL[d.estadoLead]}</Badge>
                  <div className="mt-2 text-xs text-ink/40">Presupuesto {d.presupuesto}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-ink/10 bg-paper">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold">Tus solicitudes de match</h2>
          <p className="mt-0.5 text-sm text-ink/50">El equipo de Sinnergia arma y confirma los candidatos.</p>
        </div>
        <ul>
          {company.matches.length === 0 && (
            <li className="px-6 py-6 text-sm text-ink/45">Todavía no hay solicitudes de match.</li>
          )}
          {company.matches.map((m) => {
            const elegidos = m.candidatos.filter((c) => c.seleccionado).length;
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-6 py-4 last:border-0">
                <div>
                  <div className="font-medium">{m.contexto}</div>
                  <div className="text-sm text-ink/50">
                    {m.estado === "cerrado"
                      ? m.resultado ?? "Match cerrado."
                      : `${m.candidatos.length} candidatos en evaluación`}
                    {elegidos > 0 && m.estado !== "cerrado" && <span> · {elegidos} preseleccionado(s)</span>}
                  </div>
                </div>
                <Badge variant={estadoVariant(m.estado)}>{ESTADO_MATCH_LABEL[m.estado]}</Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
