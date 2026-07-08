import { listContacts } from "@/lib/data";
import { ContactosTable } from "@/components/admin/ContactosTable";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
  const contacts = await listContacts();

  const rows = contacts.map((c) => ({
    id: c.id,
    empresa: c.company,
    freelancer: c.professional,
    status: c.status as string,
    createdAt: c.createdAt,
  }));

  // Ranking de empresas por volumen de contactos (para detectar spam).
  const counts = new Map<string, { id: string; nombre: string; count: number }>();
  for (const c of contacts) {
    const cur = counts.get(c.company.id) ?? { id: c.company.id, nombre: c.company.nombre, count: 0 };
    cur.count++;
    counts.set(c.company.id, cur);
  }
  const topEmpresas = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .filter((e) => e.count > 1); // solo mostrar empresas con más de un contacto

  return <ContactosTable initial={rows} topEmpresas={topEmpresas} />;
}
