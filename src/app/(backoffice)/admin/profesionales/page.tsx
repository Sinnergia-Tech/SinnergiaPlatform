import { listProfessionals } from "@/lib/data";
import { ProfesionalesTable } from "@/components/admin/ProfesionalesTable";

export const dynamic = "force-dynamic";

export default async function ProfesionalesPage() {
  const list = await listProfessionals();
  return <ProfesionalesTable initial={list} />;
}
