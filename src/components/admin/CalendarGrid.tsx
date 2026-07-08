"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelMeetingAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

export type CalendarMeeting = {
  id: string;
  titulo: string;
  empresa: string;
  companyId: string;
  startsAt: string;
  endsAt: string;
  meetUrl: string | null;
  htmlLink: string | null;
  estado: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function CalendarGrid({ meetings }: { meetings: CalendarMeeting[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selected, setSelected] = useState<CalendarMeeting | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const close = () => {
    setSelected(null);
    setConfirmingCancel(false);
  };

  const cancelMeeting = (id: string) =>
    startTransition(async () => {
      const res = await cancelMeetingAction(id);
      if (res.ok) {
        toast.success("Sesión cancelada.");
        close();
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo cancelar la sesión.");
      }
    });

  // Índice de sesiones por día (clave año-mes-día en hora local).
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarMeeting[]>();
    for (const m of meetings) {
      if (m.estado === "cancelada") continue;
      const key = ymd(new Date(m.startsAt));
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [meetings]);

  const { year, month } = cursor;
  const todayKey = ymd(new Date());

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };
  const goToday = () => {
    const n = new Date();
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
  };

  return (
    <div className="border border-ink/10 bg-paper">
      {/* Cabecera de navegación */}
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/60">
          {MESES[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="border border-ink/20 px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-ink/70 hover:border-ink hover:text-ink"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Mes anterior"
            className="border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Mes siguiente"
            className="border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-ink hover:text-ink"
          >
            ›
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-ink/10 text-center text-[0.7rem] uppercase tracking-[0.08em] text-ink/40">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const key = day !== null ? `${year}-${month}-${day}` : `blank-${i}`;
          const dayMeetings = day !== null ? byDay.get(`${year}-${month}-${day}`) ?? [] : [];
          const isToday = day !== null && `${year}-${month}-${day}` === todayKey;
          return (
            <div
              key={key}
              className={`min-h-[104px] border-b border-r border-ink/8 p-1.5 ${
                day === null ? "bg-smoke/40" : ""
              } ${i % 7 === 0 ? "border-l" : ""}`}
            >
              {day !== null && (
                <>
                  <div
                    className={`mb-1 inline-flex h-6 w-6 items-center justify-center text-xs ${
                      isToday ? "bg-ink font-medium text-paper" : "text-ink/50"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelected(m)}
                        className="block w-full truncate border-l-2 border-ink bg-smoke px-1.5 py-1 text-left text-[0.7rem] leading-tight text-ink/80 hover:bg-ash"
                        title={`${hhmm(m.startsAt)} · ${m.empresa}`}
                      >
                        <span className="font-medium">{hhmm(m.startsAt)}</span> {m.empresa}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
          onClick={close}
        >
          <div className="relative w-full max-w-md bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-lg leading-none text-ink/50 hover:text-ink"
            >
              ✕
            </button>
            <div className="text-xs uppercase tracking-[0.1em] text-ink/40">Sesión de consulta</div>
            <h3 className="mt-1 text-lg font-semibold">{selected.empresa}</h3>
            <p className="mt-2 text-sm capitalize text-ink/70">
              {new Date(selected.startsAt).toLocaleString("es-AR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" – "}
              {hhmm(selected.endsAt)}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {selected.meetUrl && (
                <a
                  href={selected.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper"
                >
                  Unirse al Meet ↗
                </a>
              )}
              <Link
                href={`/admin/empresas/${selected.companyId}`}
                className="border border-ink/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink/70 hover:border-ink hover:text-ink"
              >
                Ver empresa
              </Link>
            </div>

            <div className="mt-5 border-t border-ink/10 pt-4">
              {confirmingCancel ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-ink/60">¿Cancelar esta sesión?</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => cancelMeeting(selected.id)}
                    className="border border-ink bg-ink px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-paper hover:bg-ink/85 disabled:opacity-50"
                  >
                    {pending ? "Cancelando…" : "Sí, cancelar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(false)}
                    className="text-xs text-ink/45 hover:text-ink"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="text-xs text-ink/45 underline-offset-4 hover:text-ink hover:underline"
                >
                  Cancelar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
