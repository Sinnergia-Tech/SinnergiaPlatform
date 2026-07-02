"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/auth-actions";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-blanco.png"
            alt="Sinnergia"
            className="h-12 w-12 object-contain"
          />
          <h1 className="mt-6 text-2xl font-light">Ingresá a Sinnergia</h1>
          <p className="mt-2 text-sm text-paper/50">
            Acceso a tu cuenta y al backoffice.
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Contraseña"
            autoComplete="current-password"
            className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
          />

          {errorMessage && (
            <p className="text-sm text-paper/80">⚠ {errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85 disabled:opacity-60"
          >
            {isPending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs leading-relaxed text-paper/35">
          Usuarios demo (seed): nico@example.com / lucia@janos.example — contraseña{" "}
          <span className="text-paper/50">demo1234</span>
        </p>
      </div>
    </main>
  );
}
