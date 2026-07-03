import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Avatar } from "@/components/directory/Avatar";
import { Badge, estadoVariant } from "@/components/admin/ui";
import { Container } from "@/components/ui/Container";
import {
  listContactsForCompany,
  listContactsForFreelancer,
  countUnreadContacts,
} from "@/lib/data";
import { CONTACT_STATUS_LABEL } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

function fecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ContactosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { role, professionalId, companyId } = session.user;
  const nombre = session.user.name ?? "";
  if (role === "admin") redirect("/admin");

  const unreadContacts =
    role === "freelancer" && professionalId
      ? await countUnreadContacts(professionalId)
      : 0;

  const contactsEmpresa =
    role === "empresa" && companyId ? await listContactsForCompany(companyId) : null;
  const contactsFreelancer =
    role === "freelancer" && professionalId
      ? await listContactsForFreelancer(professionalId)
      : null;

  return (
    <div className="min-h-screen bg-smoke">
      <AccountTopbar user={{ nombre, rol: role }} unreadContacts={unreadContacts} />
      <main className="py-10">
        <Container className="max-w-[1000px]">
          <p className="kicker text-ink/40">Tu cuenta</p>
          <h1 className="mt-2 text-2xl font-semibold">Mis contactos</h1>
          <p className="mt-1 text-sm text-ink/50">
            {role === "empresa"
              ? "Freelancers a los que le enviaste una solicitud de contacto."
              : "Empresas que quisieron contactarte."}
          </p>

          <div className="mt-8 border border-ink/10 bg-paper">
            {contactsEmpresa && (
              <ul>
                {contactsEmpresa.length === 0 && (
                  <li className="px-6 py-8 text-sm text-ink/45">
                    Todavía no contactaste a ningún freelancer. Buscalos en{" "}
                    <Link href="/red" className="link-underline text-ink">
                      la Red
                    </Link>
                    .
                  </li>
                )}
                {contactsEmpresa.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 border-b border-ink/5 px-6 py-4 last:border-0"
                  >
                    <Avatar name={c.professional.nombre} fotoUrl={c.professional.fotoUrl} size={44} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/red/${c.professional.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.professional.nombre}
                      </Link>
                      <div className="text-sm text-ink/50">
                        {c.professional.titular}
                        {c.professional.ubicacion && <> · {c.professional.ubicacion}</>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant={estadoVariant(c.status)}>
                        {CONTACT_STATUS_LABEL[c.status]}
                      </Badge>
                      <div className="mt-1 text-xs text-ink/40">{fecha(c.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {contactsFreelancer && (
              <ul>
                {contactsFreelancer.length === 0 && (
                  <li className="px-6 py-8 text-sm text-ink/45">
                    Todavía no te contactó ninguna empresa.
                  </li>
                )}
                {contactsFreelancer.map((c) => (
                  <li key={c.id} className="border-b border-ink/5 last:border-0">
                    <Link
                      href={`/cuenta/contactos/${c.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-smoke"
                    >
                      <Avatar name={c.company.nombre} fotoUrl={c.company.logoUrl} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          {c.company.nombre}
                          {!c.readAt && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-ink" title="Sin leer" />
                          )}
                        </div>
                        <div className="text-sm text-ink/50">
                          {c.company.rubro}
                          {c.company.ubicacion && <> · {c.company.ubicacion}</>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge variant={estadoVariant(c.status)}>
                          {CONTACT_STATUS_LABEL[c.status]}
                        </Badge>
                        <div className="mt-1 text-xs text-ink/40">{fecha(c.createdAt)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}
