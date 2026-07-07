"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  disableOwnAccountAction,
  deleteOwnAccountAction,
} from "@/lib/account-actions";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";
import { useToast } from "@/components/ui/Toast";

const inputCls =
  "w-full border border-ink/20 bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ink";

const rowBtn =
  "shrink-0 border border-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] hover:bg-ink hover:text-paper";

export function AccountSettings() {
  return (
    <section className="border border-ink/20 bg-paper p-6">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
        Zona de cuenta
      </h2>
      <ChangePasswordRow />
      <DisableRow />
      <DeleteRow />
    </section>
  );
}

function ChangePasswordRow() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const newOk = isPasswordValid(next);
  const match = confirm.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && newOk && match && !pending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (res.ok) {
        toast.success("Contraseña actualizada");
        setCurrent("");
        setNext("");
        setConfirm("");
        setOpen(false);
      } else {
        setMsg({ ok: false, text: res.error ?? "No se pudo cambiar la contraseña." });
      }
    });
  };

  return (
    <div className="mt-5 border-b border-ink/10 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <p className="font-medium">Cambiar contraseña</p>
          <p className="mt-0.5 text-sm text-ink/55">
            Actualizá tu contraseña ingresando la actual.
          </p>
        </div>
        <button
          onClick={() => {
            setOpen((v) => !v);
            setMsg(null);
          }}
          className={rowBtn}
        >
          {open ? "Cerrar" : "Cambiar"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 max-w-sm space-y-3">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña actual"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
          />
          <div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nueva contraseña"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputCls}
            />
            <p
              className={`mt-1.5 text-xs ${
                next.length > 0 && !newOk ? "text-ink" : "text-ink/40"
              }`}
            >
              {next.length > 0 && !newOk ? `⚠ ${PASSWORD_HINT}` : PASSWORD_HINT}
            </p>
          </div>
          <div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repetir nueva contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
            />
            {confirm.length > 0 && !match && (
              <p className="mt-1.5 text-xs text-ink">⚠ Las contraseñas no coinciden</p>
            )}
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-ink/60" : "text-ink"}`}>
              {msg.ok ? msg.text : `⚠ ${msg.text}`}
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}

function DisableRow() {
  const router = useRouter();
  const toast = useToast();
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [pending, startTransition] = useTransition();

  const disable = () =>
    startTransition(async () => {
      await disableOwnAccountAction();
      toast.success("Cuenta deshabilitada");
      router.refresh();
    });

  return (
    <div className="mt-6 flex flex-col gap-3 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md">
        <p className="font-medium">Deshabilitar mi cuenta</p>
        <p className="mt-0.5 text-sm text-ink/55">
          Dejás de ser visible para otras empresas y freelancers. Podés
          reactivarla cuando quieras volviendo a iniciar sesión.
        </p>
      </div>
      {confirmDisable ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={disable}
            disabled={pending}
            className="border border-ink bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper hover:bg-ink/85 disabled:opacity-50"
          >
            {pending ? "…" : "Confirmar"}
          </button>
          <button
            onClick={() => setConfirmDisable(false)}
            className="px-3 py-2.5 text-xs text-ink/50 hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDisable(true)} className={rowBtn}>
          Deshabilitar
        </button>
      )}
    </div>
  );
}

function DeleteRow() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [pending, startTransition] = useTransition();

  const del = () =>
    startTransition(async () => {
      // Redirige (signOut) — no vuelve de esta llamada en caso de éxito.
      await deleteOwnAccountAction();
    });

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <p className="font-medium">Eliminar mi cuenta</p>
          <p className="mt-0.5 text-sm text-ink/55">
            Se borran tus datos personales y tu perfil deja de existir. Esta
            acción no se puede deshacer.
          </p>
        </div>
        {!confirmDelete && (
          <button onClick={() => setConfirmDelete(true)} className={rowBtn}>
            Eliminar
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="mt-4 border border-ink/25 bg-smoke p-4">
          <p className="text-sm text-ink/70">
            Escribí <strong>ELIMINAR</strong> para confirmar. Esto es definitivo.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="ELIMINAR"
              className={`${inputCls} sm:max-w-[220px]`}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={del}
                disabled={deleteText !== "ELIMINAR" || pending}
                className="border border-ink bg-ink px-5 py-3 text-xs font-medium uppercase tracking-[0.1em] text-paper hover:bg-ink/85 disabled:opacity-40"
              >
                {pending ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteText("");
                }}
                className="px-3 py-3 text-xs text-ink/50 hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
