"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scheduleMeetingAction, cancelMeetingAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/admin/ui";

export type MeetingRow = {
  id: string;
  titulo: string;
  startsAt: string;
  endsAt: string;
  meetUrl: string | null;
  htmlLink: string | null;
  estado: string;
};

const DURACIONES = [30, 45, 60, 90];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgendarSesion({
  companyId,
  diagnosisId,
  meetings,
  calendarConnected,
}: {
  companyId: string;
  diagnosisId?: string;
  meetings: MeetingRow[];
  calendarConnected: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(45);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora) return;
    setPending(true);
    const res = await scheduleMeetingAction({
      companyId,
      diagnosisId,
      fecha,
      hora,
      duracionMin: duracion,
    });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      setFecha("");
      setHora("");
      toast.success("Sesión agendada. Se invitó a la empresa por mail.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo agendar la sesión.");
    }
  };

  const cancel = async (id: string) => {
    const res = await cancelMeetingAction(id);
    if (res.ok) {
      toast.success("Sesión cancelada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo cancelar.");
    }
  };

  const activas = meetings.filter((m) => m.estado !== "cancelada");

  return (
    <div className="border border-ink/10 bg-paper p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
          Sesiones de consulta
        </h2>
        {calendarConnected ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Agendar sesión
          </button>
        ) : (
          <Link
            href="/admin/calendario"
            className="text-xs text-ink/50 underline-offset-4 hover:text-ink hover:underline"
          >
            Conectá el calendario para agendar →
          </Link>
        )}
      </div>

      {activas.length === 0 ? (
        <p className="text-sm text-ink/45">Todavía no agendaste ninguna sesión con esta empresa.</p>
      ) : (
        <ul className="space-y-3">
          {activas.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 pb-3 last:border-0"
            >
              <div>
                <div className="text-sm font-medium capitalize">{fmt(m.startsAt)}</div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-ink/50">
                  {m.meetUrl && (
                    <a
                      href={m.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link-underline text-ink"
                    >
                      Link de Meet ↗
                    </a>
                  )}
                  {m.htmlLink && (
                    <a
                      href={m.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="link-underline text-ink/60"
                    >
                      Ver en Calendar ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Agendada</Badge>
                <button
                  type="button"
                  onClick={() => cancel(m.id)}
                  className="text-xs text-ink/45 hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-md bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-lg leading-none text-ink/50 hover:text-ink"
            >
              ✕
            </button>
            <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              Agendar sesión
            </h3>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink/50">Fecha</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink/50">Hora</label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/50">Duración</label>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>
                      {d} minutos
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-[0.1em] text-ink/50 hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending || !fecha || !hora}
                  className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {pending ? "Agendando…" : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
