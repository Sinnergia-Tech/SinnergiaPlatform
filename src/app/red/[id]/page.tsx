import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAccount } from "@/lib/account-guard";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Container } from "@/components/ui/Container";
import { Avatar } from "@/components/directory/Avatar";
import { ContactarFreelancerButton } from "@/components/directory/ContactarFreelancerButton";
import { ClickableImage } from "@/components/ui/ImageLightbox";
import { PortfolioProjects } from "@/components/directory/PortfolioProjects";
import { SocialIcons } from "@/components/directory/SocialIcons";
import {
  getApprovedProfessional,
  getProfessionalWithPortfolio,
  findActiveContact,
  countUnreadContacts,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, disabled } = await requireAccount();
  if (disabled) redirect("/cuenta");
  // Vista previa del dueño: un freelancer puede ver su propio perfil como lo ve
  // una empresa, aunque todavía no esté aprobado/visible en el directorio.
  const isOwner =
    session.user.role === "freelancer" && session.user.professionalId === id;
  const p = isOwner
    ? await getProfessionalWithPortfolio(id)
    : await getApprovedProfessional(id);
  if (!p) notFound();
  const canContact = session.user.role === "empresa";
  const companyId = session.user.companyId;

  const [activeContact, unreadContacts] = await Promise.all([
    canContact && companyId ? findActiveContact(companyId, id) : null,
    session.user.role === "freelancer" && session.user.professionalId
      ? countUnreadContacts(session.user.professionalId)
      : 0,
  ]);

  return (
    <main className="min-h-screen bg-smoke">
      <AccountTopbar
        user={{ nombre: session.user.name ?? "", rol: session.user.role }}
        unreadContacts={unreadContacts}
      />

      <Container className="max-w-4xl py-10">
        {isOwner ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-ink/15 bg-paper px-5 py-3 text-sm">
            <span className="text-ink/70">
              👁 Vista previa — así ve tu perfil una empresa.
            </span>
            <Link href="/cuenta" className="link-underline text-ink">
              Volver a mi cuenta
            </Link>
          </div>
        ) : (
          <Link href="/red" className="mb-6 inline-block text-sm text-ink/50 hover:text-ink">
            ← Volver al directorio
          </Link>
        )}

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
                  {p.ubicacion && (
                    <>
                      <span>·</span>
                      <span>{p.ubicacion}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{p.disponibilidad}</span>
                </div>
                <div className="mt-3">
                  <SocialIcons socials={p} />
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
            {isOwner && (
              <div className="shrink-0 text-right">
                <button
                  disabled
                  className="cursor-not-allowed border border-ink/25 px-6 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ink/40"
                >
                  Contactar
                </button>
                <p className="mt-1.5 text-xs text-ink/40">Así lo ve una empresa</p>
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
          {p.portfolioUrl && (
            <div className="mt-7 border-t border-ink/10 pt-6 text-sm">
              <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="link-underline text-ink">
                Portfolio
              </a>
            </div>
          )}

          {/* Portfolio */}
          {(p.portfolioDescripcion || p.portfolioImagenes.length > 0 || p.portfolio.length > 0) && (
            <div className="mt-8 border-t border-ink/10 pt-7">
              <h2 className="mb-5 text-sm font-medium uppercase tracking-[0.1em] text-ink/50">
                Portfolio
              </h2>

              {p.portfolioDescripcion && (
                <p className="mb-6 max-w-2xl whitespace-pre-line text-ink/75">
                  {p.portfolioDescripcion}
                </p>
              )}

              {p.portfolioImagenes.length > 0 && (
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {p.portfolioImagenes.map((url) => (
                    <ClickableImage
                      key={url}
                      src={url}
                      className="aspect-square w-full border border-ink/10"
                    />
                  ))}
                </div>
              )}

              {p.portfolio.length > 0 && <PortfolioProjects items={p.portfolio} />}
            </div>
          )}
        </div>
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
