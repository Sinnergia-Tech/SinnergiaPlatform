import { notFound } from "next/navigation";
import { getProfessional } from "@/lib/data";
import { ProfesionalEditor } from "@/components/admin/ProfesionalEditor";

export const dynamic = "force-dynamic";

export default async function ProfesionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProfessional(id);
  if (!p) notFound();
  return <ProfesionalEditor initial={p} />;
}
