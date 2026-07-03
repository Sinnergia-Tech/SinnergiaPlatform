import Link from "next/link";
import { Avatar } from "./Avatar";
import { ContactarFreelancerButton } from "./ContactarFreelancerButton";

export type CardProf = {
  id: string;
  nombre: string;
  titular: string;
  fotoUrl?: string | null;
  roles: string[];
  skills: string[];
  modalidad: string;
  experiencia: string;
  honorarios: string;
  disponibilidad: string;
  ubicacion?: string | null;
  destacado: boolean;
};

export function ProfileCard({
  p,
  score,
  razones,
  featured = false,
  canContact = false,
  contactStatus = null,
}: {
  p: CardProf;
  score?: number;
  razones?: string[];
  featured?: boolean;
  canContact?: boolean;
  contactStatus?: string | null;
}) {
  return (
    <div
      className={`group flex h-full flex-col border bg-paper p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] ${
        featured ? "border-ink" : "border-ink/12 hover:border-ink"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={p.nombre} fotoUrl={p.fotoUrl} size={featured ? 60 : 52} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold leading-tight">{p.nombre}</h3>
              {p.destacado && <span className="text-ink/40" title="Destacado">★</span>}
            </div>
            <p className="text-sm uppercase tracking-[0.08em] text-ink/50">{p.titular}</p>
          </div>
        </div>
        {typeof score === "number" && (
          <div className="shrink-0 bg-ink px-2.5 py-1 text-center">
            <div className="text-sm font-semibold leading-none text-paper">{score}%</div>
            <div className="mt-0.5 text-[0.55rem] uppercase tracking-[0.1em] text-paper/60">
              match
            </div>
          </div>
        )}
      </div>

      {/* Roles + skills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[...p.roles.slice(0, 2), ...p.skills.slice(0, 2)].map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="border border-ink/15 px-2.5 py-1 text-xs text-ink/70"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Razones del match */}
      {razones && razones.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-ink/55">
          <span className="uppercase tracking-[0.1em] text-ink/40">Coincide en · </span>
          {razones[0]}
        </p>
      )}

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
        <span>{p.modalidad}</span>
        <span>·</span>
        <span>{p.experiencia}</span>
        <span>·</span>
        <span>{p.honorarios}</span>
        {p.ubicacion && (
          <>
            <span>·</span>
            <span>{p.ubicacion}</span>
          </>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
        <Link
          href={`/red/${p.id}`}
          className="link-underline text-sm font-medium text-ink"
        >
          Ver perfil
        </Link>
        {canContact && (
          <div className="ml-auto">
            <ContactarFreelancerButton professionalId={p.id} initialStatus={contactStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
