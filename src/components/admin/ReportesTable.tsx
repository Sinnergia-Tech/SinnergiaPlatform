"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import {
  setReportEstadoAction,
  hideReportedProfileAction,
  suspendReportedAccountAction,
} from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { EstadoReporte } from "@/lib/types";

type Row = {
  id: string;
  motivo: string;
  detalle: string | null;
  estado: EstadoReporte;
  createdAt: string | Date;
  professional: {
    id: string;
    nombre: string;
    titular: string;
    estado: string;
    account: { disabled: boolean; deleted: boolean } | null;
  } | null;
};

const ESTADO_LABEL: Record<EstadoReporte, string> = {
  pendiente: "Pendiente",
  revisado: "Revisado",
  descartado: "Descartado",
};

function formatFecha(value: string | Date) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

const btn =
  "border border-ink/25 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:opacity-50";

export function ReportesTable({ initial }: { initial: Row[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = (id: string, fn: (r: Row) => Row) =>
    setRows((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  const setEstado = (id: string, estado: EstadoReporte) => {
    setBusyId(id);
    patch(id, (r) => ({ ...r, estado }));
    startTransition(async () => {
      await setReportEstadoAction(id, estado);
      setBusyId(null);
    });
  };

  const hide = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await hideReportedProfileAction(id);
      if (res.ok) {
        patch(id, (r) => ({
          ...r,
          estado: "revisado",
          professional: r.professional ? { ...r.professional, estado: "oculto" } : null,
        }));
        toast.success("Perfil ocultado del directorio.");
      } else {
        toast.error(res.error ?? "No se pudo ocultar el perfil.");
      }
      setBusyId(null);
    });
  };

  const suspend = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await suspendReportedAccountAction(id);
      if (res.ok) {
        patch(id, (r) => ({
          ...r,
          estado: "revisado",
          professional:
            r.professional && r.professional.account
              ? { ...r.professional, account: { ...r.professional.account, disabled: true } }
              : r.professional,
        }));
        toast.success("Cuenta suspendida.");
      } else {
        toast.error(res.error ?? "No se pudo suspender la cuenta.");
      }
      setBusyId(null);
    });
  };

  const pendientes = rows.filter((r) => r.estado === "pendiente").length;

  return (
    <>
      <AdminPageHeader
        title="Reportes de contenido"
        subtitle={`${pendientes} pendiente(s) · ${rows.length} en total`}
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.06em] text-ink/50">
              <th className="px-5 py-3 font-medium">Perfil</th>
              <th className="px-5 py-3 font-medium">Motivo</th>
              <th className="px-5 py-3 font-medium">Detalle</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = pending && busyId === r.id;
              const prof = r.professional;
              const canHide = prof && prof.estado !== "oculto";
              const canSuspend =
                prof?.account && !prof.account.disabled && !prof.account.deleted;
              return (
                <tr key={r.id} className="border-b border-ink/5 last:border-0 align-top hover:bg-smoke/60">
                  <td className="px-5 py-4">
                    {prof ? (
                      <>
                        <Link
                          href={`/admin/profesionales/${prof.id}`}
                          className="font-medium hover:underline"
                        >
                          {prof.nombre}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink/50">
                          <span>{prof.titular}</span>
                          {prof.estado === "oculto" && <Badge variant="muted">Oculto</Badge>}
                          {prof.account?.disabled && <Badge variant="muted">Suspendida</Badge>}
                        </div>
                      </>
                    ) : (
                      <span className="text-ink/40">Perfil eliminado</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink/70">{r.motivo}</td>
                  <td className="max-w-[260px] px-5 py-4 text-ink/60">
                    {r.detalle ? (
                      <span className="whitespace-pre-line">{r.detalle}</span>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-ink/70">{formatFecha(r.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={estadoVariant(r.estado)}>{ESTADO_LABEL[r.estado]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canHide && (
                        <button type="button" disabled={busy} onClick={() => hide(r.id)} className={btn}>
                          Ocultar perfil
                        </button>
                      )}
                      {canSuspend && (
                        <button type="button" disabled={busy} onClick={() => suspend(r.id)} className={btn}>
                          Suspender cuenta
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEstado(r.id, "revisado")}
                        className="border border-ink px-3 py-1.5 text-xs font-medium hover:bg-ink hover:text-paper disabled:opacity-50"
                      >
                        Revisado
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEstado(r.id, "descartado")}
                        className={btn}
                      >
                        Descartar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/45">
                  No hay reportes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
