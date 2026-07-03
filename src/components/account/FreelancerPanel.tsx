import { Badge, estadoVariant } from "@/components/admin/ui";
import { PortfolioManager, type PortfolioItem } from "@/components/account/PortfolioManager";
import { PhotoUploadField } from "@/components/account/PhotoUploadField";
import { uploadFreelancerPhotoAction } from "@/lib/actions";
import { ESTADO_PROFESIONAL_LABEL, ESTADO_MATCH_LABEL } from "@/lib/catalogs";
import type { EstadoMatch, EstadoProfesional } from "@/lib/types";

const estadoAyuda: Record<string, string> = {
  pendiente: "Tu perfil está en revisión. Te avisamos cuando lo aprobemos.",
  aprobado: "Tu perfil está publicado y visible en el directorio.",
  rechazado: "Tu perfil no fue aprobado. Escribinos para más info.",
  oculto: "Tu perfil está oculto temporalmente del directorio.",
};

type Prof = {
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  experiencia: string;
  modalidad: string;
  honorarios: string;
  disponibilidad: string;
  estado: EstadoProfesional;
  fotoUrl: string | null;
  portfolio: PortfolioItem[];
};

type Op = {
  seleccionado: boolean;
  matchRequest: {
    contexto: string;
    estado: EstadoMatch;
    company: { nombre: string } | null;
  };
};

export function FreelancerPanel({
  data,
}: {
  data: { professional: Prof | null; oportunidades: Op[] };
}) {
  const p = data.professional;
  if (!p) return <p className="text-ink/50">No encontramos tu perfil.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-ink/40">Tu cuenta</p>
          <h1 className="mt-2 text-2xl font-semibold">Hola, {p.nombre.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/50">Estado del perfil:</span>
          <Badge variant={estadoVariant(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
        </div>
      </div>

      <div className="border border-ink/15 bg-smoke px-5 py-4 text-sm text-ink/70">
        {estadoAyuda[p.estado]}
      </div>

      <section className="border border-ink/10 bg-paper p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Tu perfil público</h2>
          <button
            disabled
            className="cursor-not-allowed border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink/40"
          >
            Editar (próximamente)
          </button>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0">
            <PhotoUploadField
              currentUrl={p.fotoUrl}
              name={p.nombre}
              uploadAction={uploadFreelancerPhotoAction}
              shape="circle"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{p.nombre}</h3>
            <p className="text-sm uppercase tracking-[0.1em] text-ink/50">{p.titular}</p>
            <p className="mt-3 text-sm text-ink/70">{p.descripcion}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {p.roles.map((r) => (
                <span key={r} className="border border-ink/15 px-3 py-1 text-xs text-ink/70">{r}</span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Meta label="Experiencia" value={p.experiencia} />
              <Meta label="Modalidad" value={p.modalidad} />
              <Meta label="Honorarios" value={p.honorarios} />
              <Meta label="Disponibilidad" value={p.disponibilidad} />
            </div>
          </div>
        </div>
      </section>

      <PortfolioManager items={p.portfolio} />

      <section className="border border-ink/10 bg-paper">
        <div className="border-b border-ink/10 px-6 py-4">
          <h2 className="font-semibold">Tus oportunidades de match</h2>
          <p className="mt-0.5 text-sm text-ink/50">Empresas donde Sinnergia te propuso como candidato.</p>
        </div>
        <ul>
          {data.oportunidades.length === 0 && (
            <li className="px-6 py-6 text-sm text-ink/45">
              Todavía no tenés oportunidades. Cuando aprueben tu perfil vas a empezar a aparecer en los matches.
            </li>
          )}
          {data.oportunidades.map((op, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-6 py-4 last:border-0">
              <div>
                <div className="font-medium">{op.matchRequest.company?.nombre}</div>
                <div className="text-sm text-ink/50">{op.matchRequest.contexto}</div>
              </div>
              <div className="flex items-center gap-3">
                {op.seleccionado ? (
                  <Badge variant="solid">Seleccionado</Badge>
                ) : (
                  <Badge variant="outline">En evaluación</Badge>
                )}
                <span className="text-xs text-ink/40">{ESTADO_MATCH_LABEL[op.matchRequest.estado]}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-ink/40">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
