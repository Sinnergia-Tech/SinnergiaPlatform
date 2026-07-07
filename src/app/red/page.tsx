import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/account-guard";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Container } from "@/components/ui/Container";
import { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import { ProfileCard } from "@/components/directory/ProfileCard";
import {
  listApprovedProfessionals,
  listContactsForCompany,
  countUnreadContacts,
} from "@/lib/data";
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

  const { session, disabled } = await requireAccount();
  if (disabled) redirect("/cuenta");
  const approved = await listApprovedProfessionals();

  const { top, resto } = rankProfessionals(approved, query, 5);
  const canContact = session.user.role === "empresa";
  const contactStatusByProfessional = new Map<string, string>();
  if (canContact && session.user.companyId) {
    const contacts = await listContactsForCompany(session.user.companyId);
    for (const c of contacts) {
      if (c.status === "pending" || c.status === "accepted") {
        contactStatusByProfessional.set(c.professionalId, c.status);
      }
    }
  }
  const unreadContacts =
    session.user.role === "freelancer" && session.user.professionalId
      ? await countUnreadContacts(session.user.professionalId)
      : 0;

  return (
    <main className="min-h-screen bg-smoke">
      <AccountTopbar
        user={{ nombre: session.user.name ?? "", rol: session.user.role }}
        unreadContacts={unreadContacts}
      />

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

                {/* Top 5 — grilla, evita cortar tarjetas en pantallas anchas */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {top.map((sc) => (
                    <ProfileCard
                      key={sc.professional.id}
                      p={sc.professional}
                      score={hasQuery ? sc.score : undefined}
                      razones={hasQuery ? sc.razones : undefined}
                      featured
                      canContact={canContact}
                      contactStatus={contactStatusByProfessional.get(sc.professional.id)}
                    />
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
                          canContact={canContact}
                          contactStatus={contactStatusByProfessional.get(sc.professional.id)}
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
