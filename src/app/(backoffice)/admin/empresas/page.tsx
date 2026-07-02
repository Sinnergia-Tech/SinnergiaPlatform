import { listCompaniesWithDiagnosis } from "@/lib/data";
import { EmpresasTable } from "@/components/admin/EmpresasTable";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const rows = await listCompaniesWithDiagnosis();
  return <EmpresasTable initial={rows} />;
}
