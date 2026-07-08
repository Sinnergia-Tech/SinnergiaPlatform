import { AdminPageHeader, Card } from "@/components/admin/ui";
import { getCalendarConnection, listMeetings, listCompaniesBasic } from "@/lib/data";
import { disconnectCalendarAction } from "@/lib/actions";
import { CalendarGrid } from "@/components/admin/CalendarGrid";
import { NuevaSesionButton } from "@/components/admin/NuevaSesionButton";

export const dynamic = "force-dynamic";

const ERROR_MSG: Record<string, string> = {
  noconfig: "Falta configurar las credenciales de Google (GOOGLE_CLIENT_ID/SECRET).",
  denied: "Cancelaste la conexión con Google.",
  state: "La sesión de conexión venció o no es válida. Probá de nuevo.",
  norefresh:
    "Google no devolvió el permiso de acceso continuo. Revocá el acceso de la app en tu cuenta de Google y volvé a conectar.",
  exchange: "No se pudo completar la conexión con Google. Probá de nuevo.",
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { error } = await searchParams;
  const [conn, meetings, companies] = await Promise.all([
    getCalendarConnection(),
    listMeetings(),
    listCompaniesBasic(),
  ]);

  const calendarMeetings = meetings.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    empresa: m.company.nombre,
    companyId: m.company.id,
    startsAt: m.startsAt.toISOString(),
    endsAt: m.endsAt.toISOString(),
    meetUrl: m.meetUrl,
    htmlLink: m.htmlLink,
    estado: m.estado,
  }));

  return (
    <>
      <AdminPageHeader
        title="Calendario"
        actions={conn ? <NuevaSesionButton companies={companies} /> : undefined}
      />

      {error && ERROR_MSG[error] && (
        <div className="mb-4 border border-ink/40 bg-paper px-5 py-3 text-sm text-ink/80">
          ⚠ {ERROR_MSG[error]}
        </div>
      )}

      {conn ? (
        <>
          <CalendarGrid meetings={calendarMeetings} />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/40">
            <span>
              Calendario del estudio · <span className="text-ink/60">{conn.email}</span>
            </span>
            <form action={disconnectCalendarAction}>
              <button
                type="submit"
                className="underline-offset-4 hover:text-ink hover:underline"
              >
                Desconectar
              </button>
            </form>
          </div>
        </>
      ) : (
        <Card className="p-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
            Calendario del estudio
          </h2>
          <p className="mt-4 max-w-xl text-sm text-ink/60">
            Conectá una cuenta de Google del estudio (ej. la del equipo). Todas las
            sesiones de consulta se van a agendar en su calendario y las van a ver los
            tres admins.
          </p>
          <a
            href="/api/google-calendar/connect"
            className="mt-5 inline-block bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85"
          >
            Conectar Google Calendar
          </a>
        </Card>
      )}
    </>
  );
}
