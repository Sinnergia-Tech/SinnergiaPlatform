import { notFound } from "next/navigation";
import { getCompanyWithDiagnosis, getFeedback } from "@/lib/data";
import { FeedbackEditor } from "@/components/admin/FeedbackEditor";

export const dynamic = "force-dynamic";

export default async function DevolucionEditorPage({
  params,
}: {
  params: Promise<{ id: string; fid: string }>;
}) {
  const { id, fid } = await params;
  const company = await getCompanyWithDiagnosis(id);
  if (!company) notFound();
  const diag = company.diagnoses[0];

  if (fid === "nueva") {
    return (
      <FeedbackEditor
        companyId={id}
        companyNombre={company.nombre}
        diagnosisId={diag?.id ?? null}
        initial={null}
      />
    );
  }

  const fb = await getFeedback(fid);
  if (!fb || fb.companyId !== id) notFound();

  return (
    <FeedbackEditor
      companyId={id}
      companyNombre={company.nombre}
      diagnosisId={fb.diagnosisId}
      initial={{
        id: fb.id,
        title: fb.title,
        descriptionMd: fb.descriptionMd,
        score: fb.score,
        fortalezasMd: fb.fortalezasMd,
        mejorasMd: fb.mejorasMd,
        categoria: fb.categoria,
        status: fb.status,
        attachments: fb.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          size: a.size,
          mimeType: a.mimeType,
        })),
      }}
    />
  );
}
