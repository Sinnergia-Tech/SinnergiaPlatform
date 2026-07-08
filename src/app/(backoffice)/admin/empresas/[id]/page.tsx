import { notFound } from "next/navigation";
import {
  getCompanyWithDiagnosis,
  listMeetingsForCompany,
  getCalendarConnection,
  getAccountByCompanyId,
  listFeedbacksForCompany,
} from "@/lib/data";
import { EmpresaDetail } from "@/components/admin/EmpresaDetail";
import { serializeAccount } from "@/lib/account-serialize";

export const dynamic = "force-dynamic";

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyWithDiagnosis(id);
  if (!company) notFound();

  const [meetings, calConn, account, feedbacks] = await Promise.all([
    listMeetingsForCompany(id),
    getCalendarConnection(),
    getAccountByCompanyId(id),
    listFeedbacksForCompany(id),
  ]);

  return (
    <EmpresaDetail
      company={company}
      meetings={meetings.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        startsAt: m.startsAt.toISOString(),
        endsAt: m.endsAt.toISOString(),
        meetUrl: m.meetUrl,
        htmlLink: m.htmlLink,
        estado: m.estado,
      }))}
      calendarConnected={!!calConn}
      account={serializeAccount(account)}
      feedbacks={feedbacks.map((f) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        score: f.score,
        createdAt: f.createdAt.toISOString(),
        publishedAt: f.publishedAt?.toISOString() ?? null,
        readAt: f.readAt?.toISOString() ?? null,
        attachmentsCount: f._count.attachments,
      }))}
    />
  );
}
