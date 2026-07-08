"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card } from "@/components/admin/ui";
import { useToast } from "@/components/ui/Toast";
import {
  adminSetAccountDisabledAction,
  adminDeleteAccountAction,
  adminResendVerificationAction,
  adminSendPasswordResetAction,
} from "@/lib/actions";

export type UsuarioRow = {
  userId: string;
  nombre: string;
  email: string;
  role: string; // freelancer | empresa
  emailVerified: boolean;
  disabledAt: string | null;
  deletedAt: string | null;
  lastLoginAt: string;
  href: string | null;
};

const INACTIVITY_DAYS = 30;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
}

function estadoDe(u: UsuarioRow) {
  if (u.deletedAt) return { label: "Eliminada", variant: "muted" as const };
  if (u.disabledAt) return { label: "Deshabilitada", variant: "muted" as const };
  if (!u.emailVerified) return { label: "Sin verificar", variant: "outline" as const };
  if (Date.now() - new Date(u.lastLoginAt).getTime() > INACTIVITY_DAYS * 86_400_000)
    return { label: "Inactiva", variant: "outline" as const };
  return { label: "Activa", variant: "solid" as const };
}

const linkBtn = "text-xs text-ink/60 underline-offset-4 hover:text-ink hover:underline disabled:opacity-40";

export function UsuariosTable({ initial }: { initial: UsuarioRow[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "freelancer" | "empresa">("todos");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const patch = (userId: string, fn: (r: UsuarioRow) => UsuarioRow) =>
    setRows((rs) => rs.map((r) => (r.userId === userId ? fn(r) : r)));

  const run = (
    userId: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    ok: string,
    after?: (r: UsuarioRow) => UsuarioRow
  ) => {
    setBusyId(userId);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(ok);
        if (after) patch(userId, after);
      } else {
        toast.error(res.error ?? "No se pudo completar la acción.");
      }
      setBusyId(null);
      setConfirmId(null);
    });
  };

  const view = useMemo(
    () =>
      rows.filter((r) => {
        if (filtro !== "todos" && r.role !== filtro) return false;
        if (q && !`${r.nombre} ${r.email}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [rows, q, filtro]
  );

  const activos = rows.filter((r) => !r.deletedAt).length;

  return (
    <>
      <AdminPageHeader title="Usuarios" subtitle={`${activos} cuenta(s) · gestión y seguridad`} />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            className="border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          >
            <option value="todos">Todos los tipos</option>
            <option value="freelancer">Freelancers</option>
            <option value="empresa">Empresas</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.06em] text-ink/50">
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Último acceso</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {view.map((u) => {
              const busy = pending && busyId === u.userId;
              const estado = estadoDe(u);
              const deleted = !!u.deletedAt;
              const disabled = !deleted && !!u.disabledAt;
              return (
                <tr key={u.userId} className="border-b border-ink/5 last:border-0 align-top hover:bg-smoke/60">
                  <td className="px-5 py-4">
                    {u.href ? (
                      <Link href={u.href} className="font-medium hover:underline">
                        {u.nombre}
                      </Link>
                    ) : (
                      <span className="font-medium">{u.nombre}</span>
                    )}
                    <div className="text-xs text-ink/50">{u.email}</div>
                  </td>
                  <td className="px-5 py-4 capitalize text-ink/70">{u.role}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-ink/70">{fmtDate(u.lastLoginAt)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {deleted ? (
                      <span className="block text-right text-xs text-ink/35">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
                        {disabled ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(u.userId, () => adminSetAccountDisabledAction(u.userId, false), "Cuenta reactivada", (r) => ({ ...r, disabledAt: null }))
                            }
                            className={linkBtn}
                          >
                            Reactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(u.userId, () => adminSetAccountDisabledAction(u.userId, true), "Cuenta suspendida", (r) => ({ ...r, disabledAt: new Date().toISOString() }))
                            }
                            className={linkBtn}
                          >
                            Suspender
                          </button>
                        )}
                        {!u.emailVerified && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(u.userId, () => adminResendVerificationAction(u.userId), "Verificación reenviada")}
                            className={linkBtn}
                          >
                            Verificación
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(u.userId, () => adminSendPasswordResetAction(u.userId), "Mail de reset enviado")}
                          className={linkBtn}
                        >
                          Reset
                        </button>
                        {u.href && (
                          <Link href={u.href} className="text-xs text-ink/60 underline-offset-4 hover:text-ink hover:underline">
                            Ver
                          </Link>
                        )}
                        {confirmId === u.userId ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                run(u.userId, () => adminDeleteAccountAction(u.userId), "Cuenta eliminada", (r) => ({ ...r, deletedAt: new Date().toISOString(), disabledAt: new Date().toISOString() }))
                              }
                              className="text-xs font-medium text-ink underline-offset-4 hover:underline disabled:opacity-40"
                            >
                              Confirmar
                            </button>
                            <button type="button" onClick={() => setConfirmId(null)} className="text-xs text-ink/40 hover:text-ink">
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmId(u.userId)}
                            className={linkBtn}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {view.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/45">
                  {rows.length === 0 ? "Todavía no hay usuarios registrados." : "Sin resultados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
