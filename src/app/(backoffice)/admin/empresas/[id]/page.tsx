import { notFound } from "next/navigation";
import {
  getCompanyWithDiagnosis,
  listMeetingsForCompany,
  getCalendarConnection,
  getAccountByCompanyId,
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

  const [meetings, calConn, account] = await Promise.all([
    listMeetingsForCompany(id),
    getCalendarConnection(),
    getAccountByCompanyId(id),
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
    />
  );
}
