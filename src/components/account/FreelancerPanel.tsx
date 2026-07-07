import { Badge, estadoVariant } from "@/components/admin/ui";
import { PortfolioManager, type PortfolioItem } from "@/components/account/PortfolioManager";
import { PhotoUploadField } from "@/components/account/PhotoUploadField";
import { EditPresentationButton } from "@/components/account/EditPresentationButton";
import { uploadFreelancerPhotoAction } from "@/lib/actions";
import { ESTADO_PROFESIONAL_LABEL } from "@/lib/catalogs";
import type { EstadoProfesional } from "@/lib/types";

const estadoAyuda: Record<string, string> = {
  pendiente: "Tu perfil está en revisión. Te avisamos cuando lo aprobemos.",
  aprobado: "Tu perfil está publicado y visible en el directorio.",
  rechazado: "Tu perfil no fue aprobado. Escribinos para más info.",
  oculto: "Tu perfil está oculto temporalmente del directorio.",
};

type Prof = {
  id: string;
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  experiencia: string;
  modalidad: string;
  honorarios: string;
  disponibilidad: string;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  estado: EstadoProfesional;
  fotoUrl: string | null;
  portfolioDescripcion: string | null;
  portfolioImagenes: string[];
  portfolio: PortfolioItem[];
};

export function FreelancerPanel({
  data,
}: {
  data: { professional: Prof | null };
}) {
  const p = data.professional;
  if (!p) return <p className="text-ink/50">No encontramos tu perfil.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker text-ink/40">Tu cuenta</p>
          <h1 className="mt-2 text-2xl font-semibold">Hola, {p.nombre.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink/50">Estado del perfil:</span>
            <Badge variant={estadoVariant(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
          </div>
          <p className="max-w-xs text-sm text-ink/50 sm:text-right">{estadoAyuda[p.estado]}</p>
        </div>
      </div>

      <section className="border border-ink/10 bg-paper p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Tu perfil público</h2>
          <div className="flex items-center gap-2">
            <a
              href={`/red/${p.id}`}
              target="_blank"
              rel="noreferrer"
              className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Visualizar
            </a>
            <EditPresentationButton
              initial={{
                nombre: p.nombre,
                titular: p.titular,
                descripcion: p.descripcion,
                roles: p.roles,
                experiencia: p.experiencia,
                modalidad: p.modalidad,
                disponibilidad: p.disponibilidad,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0">
            <PhotoUploadField
              currentUrl={p.fotoUrl}
              name={p.nombre}
              uploadAction={uploadFreelancerPhotoAction}
              shape="circle"
              size="lg"
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

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Meta label="Experiencia" value={p.experiencia} />
              <Meta label="Modalidad" value={p.modalidad} />
              <Meta label="Disponibilidad" value={p.disponibilidad} />
            </div>
          </div>
        </div>
      </section>

      <PortfolioManager
        descripcion={p.portfolioDescripcion}
        imagenes={p.portfolioImagenes}
        items={p.portfolio}
      />
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
