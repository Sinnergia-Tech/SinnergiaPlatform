import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/directory/Avatar";
import { ContactarFreelancerButton } from "@/components/directory/ContactarFreelancerButton";
import { ProfileCard } from "@/components/directory/ProfileCard";
import { Placeholder } from "@/components/ui/Placeholder";
import {
  getApprovedProfessional,
  listApprovedProfessionals,
  findActiveContact,
  listContactsForCompany,
  countUnreadContacts,
} from "@/lib/data";
import { rankProfessionals, queryFromProfessional } from "@/lib/matching";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, session] = await Promise.all([getApprovedProfessional(id), auth()]);
  if (!session?.user) redirect("/login");
  if (!p) notFound();
  const canContact = session.user.role === "empresa";
  const companyId = session.user.companyId;

  const [approved, activeContact, companyContacts, unreadContacts] = await Promise.all([
    listApprovedProfessionals(),
    canContact && companyId ? findActiveContact(companyId, id) : null,
    canContact && companyId ? listContactsForCompany(companyId) : [],
    session.user.role === "freelancer" && session.user.professionalId
      ? countUnreadContacts(session.user.professionalId)
      : 0,
  ]);
  const { top: similares } = rankProfessionals(
    approved.filter((x) => x.id !== id),
    queryFromProfessional(p),
    3
  );
  const contactStatusByProfessional = new Map<string, string>();
  for (const c of companyContacts) {
    if (c.status === "pending" || c.status === "accepted") {
      contactStatusByProfessional.set(c.professionalId, c.status);
    }
  }

  return (
    <main className="min-h-screen bg-smoke">
      <AccountTopbar
        user={{ nombre: session.user.name ?? "", rol: session.user.role }}
        unreadContacts={unreadContacts}
      />

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
            {canContact && (
              <div className="shrink-0">
                <ContactarFreelancerButton
                  professionalId={p.id}
                  initialStatus={activeContact?.status}
                />
              </div>
            )}
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

          {/* Portfolio */}
          {p.portfolio.length > 0 && (
            <div className="mt-8 border-t border-ink/10 pt-7">
              <h2 className="mb-5 text-sm font-medium uppercase tracking-[0.1em] text-ink/50">
                Portfolio
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {p.portfolio.map((item) => (
                  <article key={item.id}>
                    {item.imagenUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="aspect-[4/3] w-full border border-ink/10 object-cover"
                      />
                    ) : (
                      <Placeholder label={item.titulo} ratio="4 / 3" />
                    )}
                    <h3 className="mt-3 font-medium">{item.titulo}</h3>
                    <p className="mt-1 text-sm text-ink/60">{item.descripcion}</p>
                    {item.enlace && (
                      <a
                        href={item.enlace}
                        target="_blank"
                        rel="noreferrer"
                        className="link-underline mt-1 inline-block text-sm text-ink"
                      >
                        Ver proyecto →
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Perfiles similares */}
        {similares.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold">Perfiles similares</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {similares.map((sc) => (
                <ProfileCard
                  key={sc.professional.id}
                  p={sc.professional}
                  canContact={canContact}
                  contactStatus={contactStatusByProfessional.get(sc.professional.id)}
                />
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
