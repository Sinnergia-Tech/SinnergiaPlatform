"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@/components/admin/ui";
import { useToast } from "@/components/ui/Toast";
import {
  adminSetAccountDisabledAction,
  adminDeleteAccountAction,
  adminResendVerificationAction,
  adminSendPasswordResetAction,
} from "@/lib/actions";

export type AccountInfo = {
  userId: string;
  email: string;
  emailVerified: boolean;
  disabledAt: string | null;
  deletedAt: string | null;
  lastLoginAt: string;
} | null;

const INACTIVITY_DAYS = 30;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
}

const btn =
  "border border-ink/25 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

export function AdminAccountPanel({ account }: { account: AccountInfo }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string
  ) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo completar la acción.");
      }
    });
  };

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
        Cuenta de usuario
      </h2>

      {!account ? (
        <p className="text-sm text-ink/45">
          Este perfil no tiene una cuenta de usuario asociada (fue cargado por el equipo).
        </p>
      ) : (
        (() => {
          const deleted = account.deletedAt !== null;
          const disabled = !deleted && account.disabledAt !== null;
          const unverified = !deleted && !account.emailVerified;
          const inactive =
            !deleted &&
            !disabled &&
            Date.now() - new Date(account.lastLoginAt).getTime() >
              INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

          const estado = deleted
            ? { label: "Eliminada", variant: "muted" as const }
            : disabled
              ? { label: "Deshabilitada", variant: "muted" as const }
              : unverified
                ? { label: "Sin verificar", variant: "outline" as const }
                : inactive
                  ? { label: "Inactiva", variant: "outline" as const }
                  : { label: "Activa", variant: "solid" as const };

          return (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="text-sm">
                  <div className="font-medium">{account.email}</div>
                  <div className="mt-0.5 text-xs text-ink/45">
                    Último acceso: {fmtDate(account.lastLoginAt)}
                    {unverified && " · email sin verificar"}
                  </div>
                </div>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </div>

              {deleted ? (
                <p className="mt-5 border-t border-ink/10 pt-4 text-sm text-ink/45">
                  Esta cuenta fue eliminada y anonimizada. Es irreversible.
                </p>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-ink/10 pt-4">
                  {disabled ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => adminSetAccountDisabledAction(account.userId, false), "Cuenta reactivada")
                      }
                      className={btn}
                    >
                      Reactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => adminSetAccountDisabledAction(account.userId, true), "Cuenta suspendida")
                      }
                      className={btn}
                    >
                      Suspender
                    </button>
                  )}

                  {unverified && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => adminResendVerificationAction(account.userId), "Verificación reenviada")
                      }
                      className={btn}
                    >
                      Reenviar verificación
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => adminSendPasswordResetAction(account.userId), "Mail de reset enviado")
                    }
                    className={btn}
                  >
                    Enviar reset de contraseña
                  </button>

                  {confirmDelete ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setConfirmDelete(false);
                          run(() => adminDeleteAccountAction(account.userId), "Cuenta eliminada");
                        }}
                        className="border border-ink bg-ink px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-paper hover:bg-ink/85 disabled:opacity-50"
                      >
                        Confirmar eliminación
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-ink/45 hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmDelete(true)}
                      className={btn}
                    >
                      Eliminar cuenta
                    </button>
                  )}
                </div>
              )}
            </>
          );
        })()
      )}
    </Card>
  );
}
