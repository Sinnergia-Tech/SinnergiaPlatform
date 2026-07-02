import { Suspense } from "react";
import { SiteTopbar } from "@/components/SiteTopbar";
import { Container } from "@/components/ui/Container";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { ProfileCard } from "@/components/directory/ProfileCard";
import { listApprovedProfessionals } from "@/lib/data";
import { rankProfessionals, type MatchQuery } from "@/lib/matching";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function buildQuery(sp: SP): MatchQuery {
  const arr = (v: string | string[] | undefined) =>
    typeof v === "string" && v ? v.split(",").filter(Boolean) : [];
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  return {
    roles: arr(sp.rol),
    rubros: arr(sp.rubro),
    modalidad: str(sp.modalidad),
    experiencia: str(sp.exp),
    presupuesto: str(sp.pre),
    keywords: str(sp.q),
  };
}

export default async function RedPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const query = buildQuery(sp);
  const hasQuery = !!(
    query.roles?.length ||
    query.rubros?.length ||
    query.keywords ||
    query.modalidad ||
    query.experiencia ||
    query.presupuesto
  );

  const approved = await listApprovedProfessionals();
  const { top, resto } = rankProfessionals(approved, query, 5);

  return (
    <main className="min-h-screen bg-smoke">
      <SiteTopbar />

      <section className="border-b border-ink/10 bg-ink py-14 text-paper">
        <Container>
          <p className="kicker text-paper/40">Red Sinnergia</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Encontrá quién lo resuelva.
          </h1>
          <p className="mt-4 max-w-xl text-paper/60">
            Una red curada de profesionales, agencias y equipos. Definí qué buscás y te
            mostramos los perfiles más afines.
          </p>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Filtros */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Suspense fallback={<div className="border border-ink/12 bg-paper p-6 text-sm text-ink/40">Cargando filtros…</div>}>
              <DirectoryFilters />
            </Suspense>
          </aside>

          {/* Resultados */}
          <div className="min-w-0">
            {approved.length === 0 ? (
              <p className="text-ink/50">Todavía no hay perfiles publicados.</p>
            ) : (
              <>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold">
                    {hasQuery ? "Más relevantes para tu búsqueda" : "Perfiles destacados"}
                  </h2>
                  <span className="text-sm text-ink/45">
                    {approved.length} perfiles en la red
                  </span>
                </div>

                {/* Top 5 — carrusel horizontal */}
                <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-4">
                  {top.map((sc) => (
                    <div
                      key={sc.professional.id}
                      className="w-[300px] shrink-0 snap-start sm:w-[340px]"
                    >
                      <ProfileCard
                        p={sc.professional}
                        score={hasQuery ? sc.score : undefined}
                        razones={hasQuery ? sc.razones : undefined}
                        featured
                      />
                    </div>
                  ))}
                </div>

                {/* Seguir explorando */}
                {resto.length > 0 && (
                  <>
                    <h2 className="mb-4 mt-10 text-lg font-semibold">Seguir explorando</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {resto.map((sc) => (
                        <ProfileCard
                          key={sc.professional.id}
                          p={sc.professional}
                          score={hasQuery ? sc.score : undefined}
                          razones={hasQuery ? sc.razones : undefined}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
