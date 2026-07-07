"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateOwnAccountAction } from "@/lib/account-actions";
import { logoutAction } from "@/lib/auth-actions";
import { useToast } from "@/components/ui/Toast";

export function ReactivateAccount() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const reactivate = () =>
    startTransition(async () => {
      await reactivateOwnAccountAction();
      toast.success("Cuenta reactivada");
      router.refresh();
    });

  return (
    <section className="border border-ink/15 bg-paper p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center border border-ink text-2xl">
        ⏸
      </div>
      <h1 className="mt-6 text-2xl font-light">Tu cuenta está deshabilitada</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
        No sos visible para otras empresas y freelancers. Podés reactivarla ahora
        y volver a estar activo, o cerrar sesión.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          onClick={reactivate}
          disabled={pending}
          className="bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {pending ? "Reactivando…" : "Reactivar mi cuenta"}
        </button>
        <button
          onClick={() => logoutAction()}
          className="px-5 py-3.5 text-sm text-ink/50 transition-colors hover:text-ink"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
