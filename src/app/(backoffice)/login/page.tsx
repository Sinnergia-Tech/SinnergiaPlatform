"use client";

import { Suspense, useActionState } from "react";
import { authenticate, signInWithGoogleAction } from "@/lib/auth-actions";
import { EMAIL_NOT_VERIFIED } from "@/lib/auth-constants";
import { LoginResetBanner } from "@/components/account/LoginResetBanner";
import { ResendVerificationForm } from "@/components/account/ResendVerificationForm";

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );
  const emailNotVerified = errorMessage === EMAIL_NOT_VERIFIED;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <a href="/" aria-label="Ir a la página principal de Sinnergia">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/isotipo-blanco.png"
              alt="Sinnergia"
              className="h-12 w-12 object-contain transition-opacity hover:opacity-70"
            />
          </a>
          <h1 className="mt-6 text-2xl font-light">Ingresá a Sinnergia</h1>
          <p className="mt-2 text-sm text-paper/50">
            Acceso a tu cuenta y al backoffice.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginResetBanner />
        </Suspense>

        {googleEnabled && !emailNotVerified && (
          <>
            <form action={signInWithGoogleAction}>
              <button
                type="submit"
                className="w-full border border-paper/30 px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-paper/10"
              >
                Continuar con Google
              </button>
            </form>
            <div className="my-6 flex items-center gap-3 text-xs text-paper/35">
              <div className="h-px flex-1 bg-paper/15" />
              o
              <div className="h-px flex-1 bg-paper/15" />
            </div>
          </>
        )}

        {emailNotVerified ? (
          <div>
            <p className="text-sm text-paper/80">
              ⚠ Todavía no confirmaste tu email. Reenviá el enlace de verificación:
            </p>
            <ResendVerificationForm />
          </div>
        ) : (
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

            <p className="text-center text-xs">
              <a href="/recuperar-contrasena" className="link-underline text-paper/50">
                ¿Olvidaste tu contraseña?
              </a>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-paper/50">
          ¿No tenés cuenta?{" "}
          <a href="/crear-cuenta" className="link-underline text-paper">
            Creá una
          </a>
        </p>

        <p className="mt-6 text-center text-xs leading-relaxed text-paper/35">
          Usuarios demo (seed): nico@example.com / lucia@janos.example — contraseña{" "}
          <span className="text-paper/50">demo1234</span>
        </p>
      </div>
    </main>
  );
}
