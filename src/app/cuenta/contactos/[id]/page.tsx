import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Avatar } from "@/components/directory/Avatar";
import { Badge, estadoVariant } from "@/components/admin/ui";
import { Container } from "@/components/ui/Container";
import { getContactForFreelancer, markContactRead, countUnreadContacts } from "@/lib/data";
import { CONTACT_STATUS_LABEL } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

export default async function ContactoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "freelancer" || !session.user.professionalId) {
    redirect("/cuenta/contactos");
  }
  const professionalId = session.user.professionalId;

  const { id } = await params;
  const contact = await getContactForFreelancer(id, professionalId);
  if (!contact) notFound();

  if (!contact.readAt) {
    await markContactRead(contact.id, professionalId);
  }

  const unreadContacts = await countUnreadContacts(professionalId);
  const c = contact.company;

  return (
    <div className="min-h-screen bg-smoke">
      <AccountTopbar
        user={{ nombre: session.user.name ?? "", rol: "freelancer" }}
        unreadContacts={unreadContacts}
      />
      <main className="py-10">
        <Container className="max-w-[720px]">
          <Link href="/cuenta/contactos" className="mb-6 inline-block text-sm text-ink/50 hover:text-ink">
            ← Volver a mis contactos
          </Link>

          <div className="border border-ink/12 bg-paper p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-5">
                <Avatar name={c.nombre} fotoUrl={c.logoUrl} size={72} />
                <div>
                  <h1 className="text-2xl font-semibold">{c.nombre}</h1>
                  <p className="text-sm uppercase tracking-[0.1em] text-ink/50">{c.rubro}</p>
                </div>
              </div>
              <Badge variant={estadoVariant(contact.status)}>
                {CONTACT_STATUS_LABEL[contact.status]}
              </Badge>
            </div>

            {c.descripcion && <p className="mt-6 text-ink/75">{c.descripcion}</p>}

            <div className="mt-7 grid gap-5 border-t border-ink/10 pt-6 text-sm sm:grid-cols-2">
              <Dato label="Sitio web" value={c.sitioWeb} isLink />
              <Dato label="Cantidad de empleados" value={c.tamano} />
              <Dato label="Ubicación" value={c.ubicacion} />
              <Dato label="Persona de contacto" value={c.contacto} />
            </div>

            <p className="mt-8 border-t border-ink/10 pt-6 text-xs text-ink/40">
              Esta empresa está interesada en tu perfil. Las opciones para responder
              (aceptar, rechazar, iniciar chat) van a estar disponibles próximamente.
            </p>
          </div>
        </Container>
      </main>
    </div>
  );
}

function Dato({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-ink/40">{label}</div>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="link-underline mt-0.5 inline-block font-medium text-ink"
        >
          {value}
        </a>
      ) : (
        <div className="mt-0.5 font-medium text-ink">{value}</div>
      )}
    </div>
  );
}
