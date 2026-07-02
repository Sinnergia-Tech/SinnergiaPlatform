import { notFound } from "next/navigation";
import { getCompanyWithDiagnosis } from "@/lib/data";
import { EmpresaDetail } from "@/components/admin/EmpresaDetail";

export const dynamic = "force-dynamic";

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyWithDiagnosis(id);
  if (!company) notFound();
  return <EmpresaDetail company={company} />;
}
