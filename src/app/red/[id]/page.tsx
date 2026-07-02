import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteTopbar } from "@/components/SiteTopbar";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/directory/Avatar";
import { SolicitarMatchButton } from "@/components/directory/SolicitarMatchButton";
import { ProfileCard } from "@/components/directory/ProfileCard";
import {
  getApprovedProfessional,
  listApprovedProfessionals,
} from "@/lib/data";
import { rankProfessionals, queryFromProfessional } from "@/lib/matching";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getApprovedProfessional(id);
  if (!p) notFound();

  const approved = await listApprovedProfessionals();
  const { top: similares } = rankProfessionals(
    approved.filter((x) => x.id !== id),
    queryFromProfessional(p),
    3
  );

  return (
    <main className="min-h-screen bg-smoke">
      <SiteTopbar />

      <Container className="max-w-4xl py-10">
        <Link href="/red" className="mb-6 inline-block text-sm text-ink/50 hover:text-ink">
          ← Volver al directorio
        </Link>

        {/* Cabecera */}
        <div className="border border-ink/12 bg-paper p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar name={p.nombre} fotoUrl={p.fotoUrl} size={80} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{p.nombre}</h1>
                  {p.destacado && <span className="text-ink/40">★</span>}
                </div>
                <p className="text-sm uppercase tracking-[0.1em] text-ink/50">{p.titular}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
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
                  <span>·</span>
                  <span>{p.disponibilidad}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <SolicitarMatchButton professionalId={p.id} />
            </div>
          </div>

          <p className="mt-7 max-w-2xl text-ink/75">{p.descripcion}</p>

          {/* Detalle */}
          <div className="mt-8 grid gap-6 border-t border-ink/10 pt-7 sm:grid-cols-2">
            <Bloque label="Especialidades" items={p.roles} />
            <Bloque label="Rubros" items={p.rubros} />
            <Bloque label="Skills" items={p.skills} />
            <Bloque label="Tecnologías" items={p.tecnologias} />
            <Bloque label="Idiomas" items={p.idiomas} />
          </div>

          {/* Links */}
          {(p.portfolioUrl || p.linkedin || p.instagram) && (
            <div className="mt-7 flex flex-wrap gap-4 border-t border-ink/10 pt-6 text-sm">
              {p.portfolioUrl && (
                <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
                  Portfolio
                </a>
              )}
              {p.linkedin && <span className="text-ink/60">LinkedIn: {p.linkedin}</span>}
              {p.instagram && <span className="text-ink/60">{p.instagram}</span>}
            </div>
          )}
        </div>

        {/* Perfiles similares */}
        {similares.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold">Perfiles similares</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {similares.map((sc) => (
                <ProfileCard key={sc.professional.id} p={sc.professional} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}

function Bloque({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.1em] text-ink/40">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="border border-ink/15 px-3 py-1 text-xs text-ink/70">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
